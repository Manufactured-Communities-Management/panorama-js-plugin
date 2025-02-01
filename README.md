[panorama-ue-plugin]:https://github.com/Manufactured-Communities-Management/panorama-ue-plugin/

[panorama-frontend]:https://github.com/Manufactured-Communities-Management/panorama-frontend/


[![On Push to Master](https://github.com/Manufactured-Communities-Management/panorama-js-plugin/actions/workflows/on-push-to-master.yaml/badge.svg)](https://github.com/Manufactured-Communities-Management/panorama-js-plugin/actions/workflows/on-push-to-master.yaml)

# @mcmhomes/panorama-viewer

**@mcmhomes/panorama-viewer** is an open-source React library, made for visualizing the panorama pictures made by the [MCM Panorama UnrealEngine plugin][panorama-ue-plugin].


## Installation

To install the library, run the following command:

```bash
npm install @mcmhomes/panorama-viewer
```


## Usage

To show a panorama picture, you can use the `PanoramaViewer` component, like so:

```jsx
import {PanoramaViewer} from '@mcmhomes/panorama-viewer';

...

<PanoramaViewer homeId="xxxxxxxxx"/>
```

The `PanoramaViewer` component can be found in the [PanoramaViewer.jsx](https://github.com/Manufactured-Communities-Management/panorama-js-plugin/blob/master/src/components/PanoramaViewer.jsx) file.

The provided utility functions can be found in the [PanoramaViewerUtils.jsx](https://github.com/Manufactured-Communities-Management/panorama-js-plugin/blob/master/src/components/PanoramaViewerUtils.jsx) file.

For example code, see the [MCM Panorama Demo Frontend][panorama-frontend], the [AppViewer.jsx](https://github.com/Manufactured-Communities-Management/panorama-frontend/blob/master/src/components/AppViewer.jsx) file in particular.


# Panorama pictures


## Rendering workflow

To create panorama pictures, the following steps are taken:

1. The UnrealEngine project is set up with the [MCM Panorama UnrealEngine plugin][panorama-ue-plugin], and the render button is pressed.
    - see the [MCM Panorama UnrealEngine plugin][panorama-ue-plugin] for more information on this
    - this will cause the raw panorama pictures (PNGs) to be rendered and saved to a folder
2. The raw panorama pictures will then have to be processed by the Docker script, located at [`scripts/postprocessor/`](https://github.com/Manufactured-Communities-Management/panorama-js-plugin/tree/master/scripts/postprocessor).
    - more info down below on how to do this exactly
    - this will cause the ready-to-use panorama pictures (KTX2s) to be created
3. Optionally, to use the pictures in production, the ready-to-use panorama pictures will have to be upload to the MCM Panorama S3 bucket.
    - the Docker script will also take care of this, more info down below
    - the panorama pictures can then be viewed at `https://d11xh1fqz0z9k8.cloudfront.net/?a=xxxxxxxxx`, where `xxxxxxxxx` is the home ID (the home ID is configured in Unreal)


## Docker script

In order to process the raw panorama pictures, the Docker script will have to be used.

To run the Docker script, make sure of the following:

1. [Docker](https://www.docker.com) is installed, verify this by running `docker --version` in the command prompt.
2. Docker is running, verify this by running `docker ps` in the command prompt.
    - this should not return an error
    - it should return a table, which can be empty
3. The MCM Generate-Panorama Docker script is installed, to do this, run the `scripts/postprocessor/Dockerfile.install.cmd` script.
    - this will install the Docker script into your Docker installation
4. Finally, the Docker script can be run, by copying the `scripts/postprocessor/Dockerfile.run-XXX.cmd` script into the panorama folder on which you'd like it to run on, and by then running the copied-over script file. There are three versions of the script:
    - the "test" script, called `Dockerfile.run-test.cmd`, which will simply process the panorama pictures for testing them locally
    - the "sso" script, called `Dockerfile.run-sso.cmd`, which will not only process the panorama pictures, but also upload them to the MCM Panorama S3 bucket (for production use)
    - the "sso-full" script, called `Dockerfile.run-sso-full.cmd`, which will do the same thing as the "sso" script, but will also make sure the latest version of the post-processing script is download and installed, this is the recommended script to use in production, as it ensures the latest version of the post-processing script is used (PS: before using this script, you'll have to edit it, so that it contains the path pointing to your git repo)


## Locally testing panorama pictures (without uploading them to S3)

The [MCM Panorama Demo Frontend][panorama-frontend] (whether it's running locally or in production) can also access locally-hosted panorama pictures. This is useful to test panorama pictures before uploading them to production. To do this, make sure of the following:

1. The panorama pictures are hosted locally, like by running `npx --yes serve ./ -l 8080 --cors` in the directory where all your panorama collection folders are located.
2. You add the required query parameter to the URL, like so:
    - local demo frontend: `http://localhost:8000/?c=http://localhost:8080`
    - production demo frontend: `https://d11xh1fqz0z9k8.cloudfront.net/?c=http://localhost:8080`
    - the URL can be any URL, including any path, port number, etc, so a URL like this is also valid: `http://localhost/my-panorama-pictures`


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


## Contributing

Contributions are welcome! Please read the [CONTRIBUTING.md](CONTRIBUTING.md) for details on the process for submitting pull requests.
