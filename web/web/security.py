class ContentSecurityPolicyMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        if getattr(request, 'apply_custom_headers', False):
            # Set the Content-Security-Policy header
            response['Content-Security-Policy'] = "frame-ancestors 'self'"
            response['X-Content-Type-Options'] = 'nosniff'

        return response