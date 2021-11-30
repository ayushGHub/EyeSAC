# EyeSAC : An Interactive Visual Synchronization, Analysis and Cleaning Framework for Eye Movement Data


![alt text](https://github.com/ayushGHub/EyeSAC/blob/main/teaser.JPG)

## Instructions to run:
1.	Open Chrome with disabled security (Due to CORS error): 
"\Program Files (x86)\Google\Chrome\Application\chrome.exe" --disable-web-security --disable-gpu --user-data-dir=~/chromeTemp 	[Command for windows machine]
2.	Open html by directly clicking on index.html file
3.	Copy URL and paste in Chrome browser with disabled security
4.	In the command prompt, go to directory of the folder and run python file using this command: 
python upload_data.py

## Validations:
1.	Number of uploaded data files should be: Greater than zero and even number of files.
2.	Number of video files should be: Greater than zero.
3.	Noise Threshold Input should be: A floating point number ∈ [0, 1].
4.	Confirmation asked if difference in video durations after set start is greater than 5 secs.
5.	Tag names entered should not be empty and should be unique.

## Constraints:
1.	Uploaded CSV file and video names:
	-	Should be unique
	-	Should not contain underscores (_)
	-	Data files: Should not contain hyphens (-)  
	*_Reason:_* Row ID’s = “<prefix>_”+<file_name> (Therefore, file name obtained by split by _)  
      [For video blocks, timeframe labels, add tag labels, combine video labels]  
	 Same data_filename will be used in screen video name (Split by -)
2.	File names for screen video:
	-	screen-<player1_data_filename>-<player1_data_filename>.mp4  
	*_Reason:_* To make line chart for appropriate players
3.	File names for player video:
	-	player-<player_name>.mp4  
	*_Reason:_* Identify player videos and get starting frame number to offset for heatmap 
4. 	Screen video aspect ratio should be 16:9 (width:height)  
	*_Reason:_* Line chart margins and dimensions are set as per video’s aspect ratio
5.	For heatmap:
	-	Frame number from which heatmap starts = Minimum start time set amongst all player videos * fps
	-	Total number of frames in the heatmap = Minimum video duration amongst all player videos * fps

Feedbacks, feature requests, and contribution are welcome!

## Contributions:
[Ayush Kumar](https://github.com/ayushGHub)  
[Melita Saldanha](https://github.com/melitasaldanha)  
[Debesh Mohanty](https://github.com/debeshm)

## Citation:
1. Kumar, Ayush, et al. "Demo of the EyeSAC System for Visual Synchronization, Cleaning, and Annotation of Eye Movement Data." ACM Symposium on Eye Tracking Research and Applications. 2020

## Acknowledgments
Funded by the Deutsche Forschungsgemeinschaft (DFG, German Research Foundation) – Project-ID 251654672 – TRR 161 (Project B01),
SUNY Korea’s ICTCCP (IITP-2020-2011-1-00783) supervised by the IITP and NSF grant IIS 1527200.
