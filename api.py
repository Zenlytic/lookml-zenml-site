from modal import App, Image
import modal

from fastapi import HTTPException
from io import StringIO
from pydantic import BaseModel
# Define the Modal app and image
app = App("lookml-zenml-api")

# Create a custom image to include the `lookml-zenml` package
image = Image.debian_slim().apt_install("git").pip_install(
    ["lookml-zenml", 'lkml', 'ruamel.yaml', 'metrics-layer']
)
app = modal.App(name="lookml-zenml-api", image=image)


class Item(BaseModel):
    input_text: str


@app.function()
@modal.web_endpoint(label="lookml-zenml-api", method="POST")
def process_text(item: Item) -> str:
    """
    Function to process input text using lookml-zenml package.
    """
    from lookml_zenml.lookml_project import LookMLProject
    import lkml
    import ruamel.yaml
    from metrics_layer.core.parse.project_dumper import ProjectDumper
    try:
        try:
            parsed_lookml = lkml.load(item.input_text)
        except Exception as e:
            raise ValueError(f"Error parsing input LookML: {e}")
        if 'views' not in parsed_lookml:
            raise ValueError("No views found in the input LookML")
        views = parsed_lookml["views"]
        if len(views) != 1:
            raise ValueError("Only one view is supported at a time")
        converted = LookMLProject().convert_view(
            views[0], model_name="<TODO - MODEL NAME>"
        )
        dumper = ProjectDumper(None, None, None, None)
        sorted_converted = dumper._sort_view(converted)
        string_stream = StringIO()
        yaml = ruamel.yaml.YAML(typ="rt")
        yaml.dump(sorted_converted, string_stream)
        output_str = string_stream.getvalue()
        string_stream.close()
        return output_str
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"ERROR CONVERTING LOOKML FILE: {e}"
        )


if __name__ == "__main__":
    # Run the API locally
    with app.run():
        with open('test.view.lkml', 'r') as f:
            input_text = f.read()
        print(input_text)
        print(process_text.local(Item(input_text=input_text)))        
