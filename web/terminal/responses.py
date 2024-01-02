from dataclasses import dataclass
from django.http import JsonResponse


@dataclass(frozen=True)
class BaseApiCallReponse:
    ''' Basic Api data structure use to communicate with fronend '''
    success: bool
    message: str
    data: dict = None
    status: int = 200

    def to_json_response(self):
        return JsonResponse(self.__dict__, status=self.status)


NO_MANDATORY_PARAMS = BaseApiCallReponse(
    success=False,
    message='Mandatory parameter not given!',
    status = 400 # HTTP status code for Bad Request
).to_json_response()

SESSION_CLOSED = BaseApiCallReponse(
    success=True,
    message='Session deleted.',
    status = 200 #
).to_json_response()

SESSION_CREATED = BaseApiCallReponse(
    success=True,
    message='Session created successfully.',
    status = 201 
).to_json_response()

INVALID_REQUEST = BaseApiCallReponse(
    success=False,
    message='Bad request. Ivalid url',
    status = 400 # HTTP status code for Bad Request
).to_json_response()

