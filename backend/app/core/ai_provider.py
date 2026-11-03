import json
import re
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import httpx

from backend.app.config import settings
from backend.app.schemas.ai import AIResponseOutput

logger = logging.getLogger(__name__)

class AIException(Exception):
    """Base exception for AI provider issues."""
    def __init__(self, message: str, status_code: int = 500):
        super().__init__(message)
        self.message = message
        self.status_code = status_code

class AIConfigurationError(AIException):
    def __init__(self, message: str = "AI provider is not configured. Please supply an API key in server settings."):
        super().__init__(message, status_code=503)

class AIAuthenticationError(AIException):
    def __init__(self, message: str = "AI provider authentication failed. Please check your API key."):
        super().__init__(message, status_code=401)

class AIRateLimitError(AIException):
    def __init__(self, message: str = "AI provider rate limit exceeded. Please retry after a brief pause."):
        super().__init__(message, status_code=429)

class AITimeoutError(AIException):
    def __init__(self, message: str = "AI provider request timed out. Please try with shorter content."):
        super().__init__(message, status_code=504)

class AIProviderError(AIException):
    def __init__(self, message: str = "AI service temporarily unavailable."):
        super().__init__(message, status_code=502)

class AIValidationError(AIException):
    def __init__(self, message: str = "Received invalid or unstructured response from AI provider."):
        super().__init__(message, status_code=502)

class BaseAIProvider(ABC):
    @abstractmethod
    def is_configured(self) -> bool:
        """Return True if credentials and endpoints are present."""
        pass

    @abstractmethod
    def get_status(self) -> Dict[str, Any]:
        """Return non-sensitive status information."""
        pass

    @abstractmethod
    def generate_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: Optional[float] = None
    ) -> AIResponseOutput:
        """Call provider and return structured AIResponseOutput."""
        pass

def extract_json_payload(raw_text: str) -> Dict[str, Any]:
    """Safely extract JSON object from raw response text, stripping markdown code fences if present."""
    text = raw_text.strip()
    if text.startswith("```"):
        # Match ```json ... ``` or ``` ... ```
        match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text, re.DOTALL)
        if match:
            text = match.group(1).strip()
        else:
            # Strip first and last lines
            lines = text.splitlines()
            if len(lines) >= 2:
                text = "\n".join(lines[1:-1]).strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError as err:
        # Fallback regex search for outer braces
        first_brace = text.find("{")
        last_brace = text.rfind("}")
        if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
            sub = text[first_brace:last_brace + 1]
            try:
                return json.loads(sub)
            except json.JSONDecodeError:
                pass
        raise AIValidationError(f"Could not parse valid JSON output: {str(err)}")

class OpenAICompatibleProvider(BaseAIProvider):
    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        timeout: Optional[float] = None,
    ):
        self.base_url = (base_url or settings.AI_BASE_URL).rstrip("/")
        self.api_key = api_key if api_key is not None else settings.AI_API_KEY
        self.model = model or settings.AI_MODEL
        self.temperature = temperature if temperature is not None else settings.AI_TEMPERATURE
        self.timeout = timeout if timeout is not None else settings.AI_TIMEOUT_SECONDS

    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    def get_status(self) -> Dict[str, Any]:
        masked_url = self.base_url
        return {
            "configured": self.is_configured(),
            "provider": "openai_compatible",
            "model": self.model,
            "base_url": masked_url,
            "temperature": self.temperature,
            "timeout_seconds": self.timeout,
            "message": "AI Provider is active and configured." if self.is_configured() else "CLARITY_AI_API_KEY is not configured on the server. AI features require an API key."
        }

    def generate_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: Optional[float] = None
    ) -> AIResponseOutput:
        if not self.is_configured():
            raise AIConfigurationError()

        endpoint = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        temp = temperature if temperature is not None else self.temperature

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": temp,
            "max_tokens": settings.AI_MAX_OUTPUT_TOKENS,
            "response_format": {"type": "json_object"}
        }

        try:
            with httpx.Client(timeout=self.timeout) as client:
                resp = client.post(endpoint, headers=headers, json=payload)

                if resp.status_code == 401 or resp.status_code == 403:
                    raise AIAuthenticationError()
                elif resp.status_code == 429:
                    raise AIRateLimitError()
                elif resp.status_code >= 500:
                    raise AIProviderError(f"Upstream provider returned server error ({resp.status_code})")
                elif resp.status_code != 200:
                    raise AIProviderError(f"Provider returned error status {resp.status_code}")

                data = resp.json()
                choices = data.get("choices", [])
                if not choices:
                    raise AIValidationError("Provider returned empty choices array.")

                content_str = choices[0].get("message", {}).get("content", "")
                parsed = extract_json_payload(content_str)
                return AIResponseOutput(**parsed)

        except httpx.TimeoutException:
            raise AITimeoutError()
        except httpx.RequestError as exc:
            logger.error("AI network connection error: %s", type(exc).__name__)
            raise AIProviderError("Failed to connect to AI provider endpoint.")
        except AIException:
            raise
        except Exception as exc:
            logger.error("Unexpected error in AI generation: %s", type(exc).__name__)
            raise AIValidationError(f"Invalid output format: {str(exc)}")

class FakeAIProvider(BaseAIProvider):
    """Deterministic fake provider for test suites and offline verification."""
    def __init__(
        self,
        configured: bool = True,
        simulate_error: Optional[str] = None,
        custom_response: Optional[AIResponseOutput] = None
    ):
        self._configured = configured
        self.simulate_error = simulate_error
        self.custom_response = custom_response

    def is_configured(self) -> bool:
        return self._configured

    def get_status(self) -> Dict[str, Any]:
        return {
            "configured": self._configured,
            "provider": "fake_test_provider",
            "model": "clarity-mock-model",
            "base_url": "mock://internal",
            "temperature": 0.0,
            "timeout_seconds": 1.0,
            "message": "Mock provider for test execution." if self._configured else "Mock provider unconfigured."
        }

    def generate_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: Optional[float] = None
    ) -> AIResponseOutput:
        if not self._configured:
            raise AIConfigurationError()

        if self.simulate_error == "auth":
            raise AIAuthenticationError()
        elif self.simulate_error == "rate_limit":
            raise AIRateLimitError()
        elif self.simulate_error == "timeout":
            raise AITimeoutError()
        elif self.simulate_error == "invalid_json":
            raise AIValidationError("Simulated invalid JSON payload.")
        elif self.simulate_error == "provider_down":
            raise AIProviderError("Simulated upstream provider outage.")

        if self.custom_response:
            return self.custom_response

        # Default smart mock: extract untrusted content and rewrite predictably
        # Detect operation from system prompt
        if "procedure" in system_prompt.lower():
            return AIResponseOutput(
                content="## Overview\nThis procedure walks through configuring authentication tokens.\n\n## Prerequisites\n- Administrative workspace access\n- Active API client\n\n## Instructions\n1. Navigate to Settings.\n2. Click Create Token.\n3. Store the token safely.\n\n## Expected Result\nThe API authentication token is generated and active.\n\n## Troubleshooting\nIf token verification fails, check system clock synchronization.",
                explanation="Structured procedural steps with clear prerequisites and numbered execution orders.",
                warnings=["Ensure administrative tokens are rotated regularly."],
                meaning_sensitive_changes=[]
            )
        elif "release notes" in system_prompt.lower() or "release_notes" in system_prompt.lower():
            return AIResponseOutput(
                content="## Release Notes — v2.4.0 (2026-11-03)\n\n### Added\n- Added deterministic AST heading validation engine\n\n### Fixed\n- Fixed relative image path resolution in nested subdirectories\n\n### Deprecated\n- Legacy XML configuration formats are deprecated",
                explanation="Formatted release notes organized by categorized change entries.",
                warnings=[],
                meaning_sensitive_changes=[]
            )
        elif "simplify" in system_prompt.lower():
            return AIResponseOutput(
                content="To connect to the database, provide your connection string in the settings file. The platform will automatically verify your credentials and establish a secure connection.",
                explanation="Replaced dense jargon with plain language while preserving parameter names.",
                warnings=[],
                meaning_sensitive_changes=["Simplified technical description for target audience."]
            )
        elif "documentation" in system_prompt.lower() or "generator" in system_prompt.lower():
            return AIResponseOutput(
                content="# Feature Overview\n\nClarity provides automated documentation quality scanning.\n\n## Prerequisites\n- Node.js 20+\n- Python 3.11+\n\n## Installation\nInstall required dependencies:\n```bash\nnpm install\n```\n\n## Configuration\nSet your configuration parameters in `.env`.\n\n> [!NOTE]\n> NEEDS CONFIRMATION: Verify the exact environment variable names for staging deployment.",
                explanation="Generated complete documentation structure with marked placeholders for missing information.",
                warnings=["Flagged missing staging deployment variables with NEEDS CONFIRMATION marker."],
                meaning_sensitive_changes=[]
            )
        else:
            # Default rewrite mock
            return AIResponseOutput(
                content="Clarity evaluates technical documentation against deterministic quality rules. It checks heading hierarchies, resolves relative links, and enforces glossary consistency.",
                explanation="Improved sentence structure, active voice, and conciseness while preserving all technical terminology.",
                warnings=[],
                meaning_sensitive_changes=[]
            )

# Global default provider instance & getter for dependency injection
_default_provider: Optional[BaseAIProvider] = None

def get_ai_provider() -> BaseAIProvider:
    global _default_provider
    if _default_provider is None:
        _default_provider = OpenAICompatibleProvider()
    return _default_provider

def set_ai_provider(provider: BaseAIProvider) -> None:
    global _default_provider
    _default_provider = provider
