# hellohands




## Dataset Attribution (MS-ASL)

This project uses the MS-ASL dataset for research and prototyping purposes.
Please review and comply with the Computational Use of Data Agreement (C-UDA)
included with the dataset. All credits and rights remain with the original
authors and institutions.

Reference:
Vaezi Joze, H. R., & Koller, O. (2019). MS-ASL: A Large-Scale Data Set and
Benchmark for Understanding American Sign Language. BMVC 2019.

Files bundled with MS-ASL: MSASL_train.json, MSASL_val.json, MSASL_test.json,
MSASL_classes.json, MSASL_synonym.json, and the C-UDA license document.

## Goose validation (Section 12)

1) Verify Goose CLI works:

```
goose run --recipe "Say: hi"
```

2) Try the parallel listeners mock:

```
goose run --recipe goose/recipes/asl_listeners.yaml
```

3) Run the MVP conductor with values:

```
goose run --recipe goose/recipes/asl_mvp.yaml --values subset=100 fps=30 size=256 category=essentials pack_id=L1-ESSENTIALS
```
