"""Text classifiers behind a common fit/predict interface."""

from gabench.models.base import TextClassifier, build_model, register

__all__ = ["TextClassifier", "build_model", "register"]
