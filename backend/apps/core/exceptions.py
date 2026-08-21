from rest_framework.views import exception_handler
from rest_framework.response import Response


def custom_exception_handler(exc, context):
    """
    Custom exception handler for consistent error responses.
    """
    response = exception_handler(exc, context)

    if response is not None:
        error_data = {
            "success": False,
            "status_code": response.status_code,
            "error": response.data
        }

        # Make it cleaner
        if isinstance(response.data, dict):
            if "detail" in response.data:
                error_data["message"] = response.data["detail"]
            else:
                error_data["message"] = "Validation error"
                error_data["errors"] = response.data
        else:
            error_data["message"] = str(response.data)

        response.data = error_data

    return response