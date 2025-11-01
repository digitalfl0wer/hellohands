# Hand Landmarker Model

The practice view looks for `/hand_landmarker.task` in the Vite `public/` folder.

## Downloading locally

```bash
curl -L \
  -o public/hand_landmarker.task \
  https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task
```

If `curl` cannot resolve the hostname (common on offline networks), download the
file manually and place it at `public/hand_landmarker.task`.

## Optional script

Run the helper to fetch the model using Node:

```bash
pnpm hand:model
```

The script streams the file to disk and prints the path when complete.
