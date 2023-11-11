from django_components import component

@component.register("LoadCodeMirror")
class LoadCodeMirror(component.Component):
    template_name = "codemirror.html"


    # class Media:
    #     css = "calendar/calendar.css"
    #     js = "calendar/calendar.js