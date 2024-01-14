class ReconnectRequired(Exception):
    def __init__(self, message, session_saved=False):
        super().__init__(message)
        self.session_saved = session_saved
