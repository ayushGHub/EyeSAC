# EyeSAC
An Interactive Visual Synchronization, Analysis and Cleaning Framework for Eye Movement Data


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
