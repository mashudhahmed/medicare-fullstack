import os

_module = os.environ.get('DJANGO_SETTINGS_MODULE', '')
if 'production' in _module:
    from .production import *  # noqa: F401, F403
else:
    from .development import *  # noqa: F401, F403