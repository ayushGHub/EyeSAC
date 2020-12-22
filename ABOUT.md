# EyeSAC: An Interactive Visual Synchronization, Analysis and Cleaning Framework for Eye Movement Data

## Background:
Eye movement data analysis plays an important role in examining human cognitive processes and perceptions. Such analysis at times needs data recording from additional sources too during experiments. In this project, we study a pair programming based collaboration using two eye trackers, stimulus recording, and an external camera recording. To analyze the collected data, we introduce the EyeSAC system that synchronizes the data from different sources and that removes the noisy and missing gazes from eye tracking data with the help of visual feedback from the external recording. The synchronized and cleaned data is further annotated using our system and then exported for further analysis.

## Data:
In the pre-conducted experiment, two subjects were given a coding task to complete. They were equipped with eye-trackers that generated two numerical data-sets, one for each subject. This dataset provided the x and y coordinates they were looking at, the information of whether their eyes were set on or off a pre-decided surface and a confidence level of the tracker. All of this information was given for 20,000 frames. Additionally, videos were recorded by both eye-trackers showing where the subjects were looking. Also, two more third-party videos were recorded for reference in one of which the screen was recorded and in the other subjects’ actions were recorded. The user has to provide this numerical data as well as the four video files as input to the tool.

## Functionalities:
1. **Time Series Plot Visualization:**  Lasagna Plot is used to visualize the data and the analysis performed with respect to each time frame of the experiment.  A zoomed time series plot is also present where the user can view 20 to 300 frames in detail.
      - **Subject Data:**  This data is shown for each player based on the data file. It shows if the recorded data is noisy or missing. If not, then it shows if the player's gaze was on-screen or off-screen.
      - **Gaze Distance:** For every time frame, the distance between the gazes of both players is computed and displayed by a shades of blue which indicate if their gazes were close to (dark) or far away (light) from each other.  
3. **Noise Removal:** A frame is considered noisy based on the noise threshold selected by the user for the confidence value. Confidence value indicates how accurate the data for that frame is. Once noise has been removed, frame color changes to on-surface or off-surface.
      - **Automatic:** Removes the noise from the entire data for all frames having confidence value less than set noise threshold value.  
      - **Manual:**  Allows the user to choose the frames from which the noise has to be removed instead of from the entire data.  
4. **Annotation:** A tag is used to annotate time frames of the experiment having some similar characteristics or actions performed. The user can tag multiple portions of the timeline under one particular tag and multiple such tags can be added. Also, portions of the time series plot corresponding to a particular tag can be highlighted.  
5. **Export data:** After the user has made the required alterations for the data using the tool, this data can be exported into a single CSV file which will have the processed data for all subjects, the computed gaze distance between the subjects, and the annotation information.  
6. **Video of Interest:** The user can select portions of the timeline which are of interest in every video and merge all such portions to get one combined video of interest.
7. **Analysis of multiple experiments:** The user can analyse multiple experiments together and compare them. There should be 2 data files for the 2 players per experiment. The count of videos to be analysed can be chosen by the user.  

## Technologies used:
- **Backend (Data-preprocessing, Data-processing and Video-processing):** Python libraries
- **Front-end:** JavaScript, d3.js version 4 library, jQuery, HTML5, CSS
- **Connection from the backend to the front-end:** Flask framework
