Put your eye gaze data in this folder.

1. Uploaded CSV file names:
    - Should be unique
    - Should not contain underscores (_) or hyphens (-)

2. Columns that should be present in the data files:

    | Column Name                             | Required / Optional | Data Type and range       | Details                           |
    |-----------------------------------------|---------------------|---------------------------|-----------------------------------|
    | world_frame_idx                         | Required            | Integer [0, inf)          | Frame number                      |
    | x_norm                                  | Required            | Floating Point [0, 1]     | Normalized value of X co-ordinate |
    | y_norm                                  | Required            | Floating Point [0, 1]     | Normalized value of Y co-ordinate |
    | on_srf                                  | Required            | Boolean [TRUE / FALSE]    | Indicates if user is looking on the surface or off the surfacee |
    | confidence                              | Required            | Floating Point [0, 1]     | Confidence value of the eye tracking equipment which determines if the data is noisy |
    | **added-visualizations_**<_ColumName_>  | Optional            | Floating Point (-inf, inf)| Any additional columns to be visualized on the heatmap |
