import pandas as pd
import numpy as np
import math
import json
import cv2
from flask import Flask
from flask import jsonify
from flask import request
from flask_cors import CORS

app = Flask(__name__)
cors = CORS(app)

# Initialize values by default
frame_start = 0
total_frames = 0
noise_threshold = 0.5

players_noisy_frames = []			# Set of noisy frame numbers
players_missing_frames = []			# Set of missing frame numbers
players_off_surface_frames = []		# Set of off surface frame numbers
players_new_df = []					# List of all frames which are not from the above categories, given with x and y values

player_all_frames = []				# All frames from 0 - total_frames: Value = 1, 10, 100, 1000
gaze_distance_df = []				# All frames from 0 - total_frames: Value = 1000, 100000, or distance between gazes of both players
trackNoiseClearedFrames = []		# Set of frame numbers from which noise is already cleared

export_data_count = 0

# On set_start button click
@app.route('/generate_data', methods=['GET', 'POST'])
def generate_data():
	global frame_start, total_frames, noise_threshold, trackNoiseClearedFrames, gaze_distance_df, player_all_frames

	# Player's data
	data_sources = (request.get_json())['data_sources']
	data_labels = (request.get_json())['data_labels']
	noise_threshold = (request.get_json())['noise_threshold']
	frame_start = (request.get_json())['frame_start']
	total_frames = (request.get_json())['total_frames']
	caller = (request.get_json())['caller']

	# Call functions on visualize
	gaze_distance_df = []
	player_all_frames = []
	prepareTimeline(data_sources, data_labels)

	if(caller=="set_start"):
		prepareLineChart(data_labels)
		trackNoiseClearedFrames = []
		for i in range(len(data_labels)):
			trackNoiseClearedFrames.append(set())
	else:
		cleanNoiseInGivenFrames(data_labels, trackNoiseClearedFrames)

	return jsonify({"data":data_sources})


# Prepare timeframe file

def between_zero_and_one(x, y):
    if x<0 or x>1 or y<0 or y>1:
        return False
    return True

def distance(x, y):
	distance = math.sqrt((x[1]-y[1])**2 + (x[2]-y[2])**2)
	if distance>1:
		distance = 1.0
	return distance

def getPlayerFiles(data_source):
	player_df = pd.read_csv(data_source)
	player_df = player_df[player_df['world_frame_idx'] >= frame_start]	# Only keep frames >= frame_start
	player_df['world_frame_idx'] = player_df['world_frame_idx']-frame_start	# Replace frame_number by frame_number-frame_start

	player_df = player_df[['world_frame_idx', 'x_norm', 'y_norm', 'on_srf', 'confidence']].values.tolist()
	player_df.sort(key=lambda x: x[0])	# Sort by frame numbers

	return player_df

def getPlayerNoisyFrames(player_df):
	player_noisy = set()

	for i in player_df:
		if (float(i[4])<noise_threshold or (i[3]==True and not between_zero_and_one(i[1], i[2]))):
			player_noisy.add(i[0])

	return player_noisy

def getPlayerOffSurfaceFrames(player_df, player_noisy):
	player_off_surface = set()

	for i in player_df:
		if (float(i[4])>=noise_threshold and i[3]==False):
			player_off_surface.add(i[0])

	return (player_off_surface-player_noisy)

def getNewPlayerFiles(player_df, player_noisy, player_off_surface):

	# Finding avg if more than one frame of same no
	i = 0
	n = len(player_df)
	player_df_avg = []

	while i<n:
		frame_no = player_df[i][0]
		if((frame_no not in player_noisy) and (frame_no not in player_off_surface)):
			sum_x, sum_y, c = player_df[i][1], player_df[i][2], 1
			while i<n-1 and player_df[i][0]==player_df[i+1][0]:
				sum_x += player_df[i+1][1]
				sum_y += player_df[i+1][2]
				c += 1
				i += 1
			player_df_avg.append([frame_no, sum_x/c, sum_y/c, True])
		i += 1

	return player_df_avg

def getPlayerMissingFrames(player_df, player_noisy, player_off_surface):
	player_missing = set()

	player_len = len(player_df)
	player_index, total_frames_index = 0, 0

	while total_frames_index<total_frames:

		if player_index<player_len:
			if total_frames_index!=player_df[player_index][0]:
				player_missing.add(total_frames_index)
			else:
				player_index += 1
		else:
			player_missing.add(total_frames_index)

		total_frames_index += 1

	player_missing = player_missing-player_noisy-player_off_surface

	return player_missing

def generatePlayerTSV(player_label, player_noisy, player_off_surface, player_missing):
	global player_all_frames

	player_file_TSV = []
	total_frames_index = 0

	while total_frames_index<total_frames:

		if total_frames_index in player_noisy:
			player_file_TSV.append([total_frames_index, 100]) # noisy (if frame is noisy)
		elif total_frames_index in player_missing:
		    player_file_TSV.append([total_frames_index, 10]) # missing
		elif total_frames_index in player_off_surface:
		    player_file_TSV.append([total_frames_index, 1]) # off surface
		else:
			player_file_TSV.append([total_frames_index, 1000]) # on surface

		total_frames_index += 1

	player_all_frames.append(player_file_TSV)

	res = pd.DataFrame(player_file_TSV, columns=['frame_no', 'value'])
	res.to_csv("generated_files/player_"+player_label+".tsv", sep='\t', index=False)

def generateGazeDistanceTSV(player1_df, player2_df, player1_label, player2_label, player1_missing, player2_missing):
	global gaze_distance_df

	gaze_distance = []

	player1_len, player2_len = len(player1_df), len(player2_df)
	player1_index, player2_index, total_frames_index = 0, 0, 0

	while total_frames_index<total_frames:

		# Both frames present, calculate distance
		if (total_frames_index not in player1_missing) and (total_frames_index not in player2_missing):
			gaze_distance.append([total_frames_index, distance(player1_df[player1_index], player2_df[player2_index])])
			player1_index += 1
			player2_index += 1

		# Player 2 frame missing
		elif (total_frames_index not in player1_missing):
			gaze_distance.append([total_frames_index, 1000])
			player1_index += 1

		# Player 1 frame missing
		elif (total_frames_index not in player2_missing):
			gaze_distance.append([total_frames_index, 1000])
			player2_index += 1

		# Both missing
		else:
			gaze_distance.append([total_frames_index, 100000])

		total_frames_index += 1

	gaze_distance_df.append(gaze_distance)

	res = pd.DataFrame(gaze_distance, columns=['frame_no', 'value'])
	res.to_csv("generated_files/gaze-distance_"+player1_label+"_"+player2_label+".tsv", sep='\t', index=False)


def generateStatisticsCSV(players_noisy_list, players_missing_list):
	res = []

	res.append(["Total Frames", str(total_frames)])

	for i in range(0, len(players_missing_list)):
		res.append(["Player "+str(i+1)+": Missing", str(players_missing_list[i])+" frames"])

	res.append(["Noise Threshold", str(noise_threshold)])

	for i in range(0, len(players_noisy_list)):
		res.append(["Player "+str(i+1)+": Noise", str(players_noisy_list[i])+" frames"])

	res = pd.DataFrame(res, columns=["Category", "Value"])
	res.to_csv("generated_files/stats.tsv", sep='\t', index=False)


def prepareTimeline(data_sources, data_labels):
	global players_new_df, players_noisy_frames, players_off_surface_frames, players_missing_frames

	players_new_df = []
	players_noisy_frames = []
	players_missing_frames = []
	players_off_surface_frames = []

	players_noisy_list = []
	players_missing_list = []

	i = 0
	while i<len(data_sources):
		player1_df = getPlayerFiles(data_sources[i])
		player2_df = getPlayerFiles(data_sources[i+1])

		player1_noisy = getPlayerNoisyFrames(player1_df)
		player2_noisy = getPlayerNoisyFrames(player2_df)

		player1_off_surface = getPlayerOffSurfaceFrames(player1_df, player1_noisy)
		player2_off_surface = getPlayerOffSurfaceFrames(player2_df, player2_noisy)

		player1_df = getNewPlayerFiles(player1_df, player1_noisy, player1_off_surface)
		player2_df = getNewPlayerFiles(player2_df, player2_noisy, player2_off_surface)

		player1_missing = getPlayerMissingFrames(player1_df, player1_noisy, player1_off_surface)
		player2_missing = getPlayerMissingFrames(player2_df, player2_noisy, player2_off_surface)

		generatePlayerTSV(data_labels[i], player1_noisy, player1_off_surface, player1_missing)
		generatePlayerTSV(data_labels[i+1], player2_noisy, player2_off_surface, player2_missing)

		generateGazeDistanceTSV(player1_df, player2_df, data_labels[i], data_labels[i+1],
		(player1_noisy|player1_off_surface|player1_missing), (player2_noisy|player2_off_surface|player2_missing))

		# Save for statistics
		players_noisy_list.append(len(player1_noisy))
		players_noisy_list.append(len(player2_noisy))
		players_missing_list.append(len(player1_missing))
		players_missing_list.append(len(player2_missing))

		# Save for later
		players_new_df.append(player1_df)
		players_new_df.append(player2_df)
		players_noisy_frames.append(player1_noisy)
		players_noisy_frames.append(player2_noisy)
		players_off_surface_frames.append(player1_off_surface)
		players_off_surface_frames.append(player2_off_surface)
		players_missing_frames.append(player1_missing)
		players_missing_frames.append(player2_missing)

		# To get next two player files
		i += 2

	generateStatisticsCSV(players_noisy_list, players_missing_list)


# Line chart file
def prepareLineChart(data_labels):
	global players_new_df, players_noisy_frames, players_off_surface_frames, players_missing_frames

	i = 0
	line_chart_data = []

	while i<len(data_labels):

		player1_index, player2_index, total_frames_index = 0, 0, 0
		player1_df, player2_df = players_new_df[i], players_new_df[i+1]
		player1_len, player2_len = len(player1_df), len(player2_df)
		player1_prev, player2_prev = (0, 0), (0, 0)

		player1_missing = players_noisy_frames[i]|players_off_surface_frames[i]|players_missing_frames[i]
		player2_missing = players_noisy_frames[i+1]|players_off_surface_frames[i+1]|players_missing_frames[i+1]

		while total_frames_index<total_frames:

			player_names = data_labels[i] + "_" + data_labels[i+1]

			# Both frames present
			if (total_frames_index not in player1_missing) and (total_frames_index not in player2_missing):
				line_chart_data.append([player_names, total_frames_index, player1_df[player1_index][1], player1_df[player1_index][2], player2_df[player2_index][1], player2_df[player2_index][2], distance(player1_df[player1_index], player2_df[player2_index])])
				player1_prev = (player1_df[player1_index][1], player1_df[player1_index][2])
				player2_prev = (player2_df[player2_index][1], player2_df[player2_index][2])
				player1_index += 1
				player2_index += 1

			# Player 2 frame missing
			elif (total_frames_index not in player1_missing):
				line_chart_data.append([player_names, total_frames_index, player1_df[player1_index][1], player1_df[player1_index][2], player2_prev[0], player2_prev[1], 1000])
				player1_prev = (player1_df[player1_index][1], player1_df[player1_index][2])
				player1_index += 1

			# Player 1 frame missing
			elif (total_frames_index not in player2_missing):
				line_chart_data.append([player_names, total_frames_index, player1_prev[0], player1_prev[1], player2_df[player2_index][1], player2_df[player2_index][2], 1000])
				player2_prev = (player2_df[player2_index][1], player2_df[player2_index][2])
				player2_index += 1

			# Both players frames missing
			else:
				line_chart_data.append([player_names, total_frames_index, player1_prev[0], player1_prev[1], player2_prev[0], player2_prev[1], 100000])

			total_frames_index += 1

		# To get next two player files
		i+=2

	res = pd.DataFrame(line_chart_data, columns=['player_names','world_frame_idx', 'player1_x', 'player1_y', 'player2_x', 'player2_y', 'dist'])
	res.to_csv("generated_files/line-chart.tsv", sep='\t', index=False)


# Clean frame: For both noise cleaning functions
def getCleanFrameVal(data_index, frameNo, prevFrame):

	sx, sy, count = 0, 0, 0
	data = players_new_df[data_index]

	# Find index of frame just before frame_no in data
	i = prevFrame
	while(i<len(data)):
		if(data[i][0]>frameNo):
			break
		i += 1
	prevFrame = i-1

	# Get sum of two frames before frame_no (if exists)
	c = 0
	i = prevFrame
	while c!=2 and i>=0:
		sx += data[i][1]
		sy += data[i][2]
		count += 1
		c += 1
		i -= 1

    # Get sum of two frames after frame_no (if exists)
	c = 0
	i = prevFrame + 1
	while c!=2 and i<len(data):
		sx += data[i][1]
		sy += data[i][2]
		count += 1
		c += 1
		i += 1

	# Add new frame (noisy converted to on-surface)
	# where x and y is avg of previous 2 and next 2 frames
	players_new_df[data_index].append([frameNo, sx/count, sy/count, True])

	return prevFrame

def calculateAfterNoiseRemoval(data_labels):
	global players_noisy_list, players_missing_list, gaze_distance_df, player_all_frames

	players_noisy_list = []
	players_missing_list = []
	gaze_distance_df = []
	player_all_frames = []

	i = 0
	while(i<len(data_labels)):

		generatePlayerTSV(data_labels[i], players_noisy_frames[i], players_off_surface_frames[i], players_missing_frames[i])
		generatePlayerTSV(data_labels[i+1], players_noisy_frames[i+1], players_off_surface_frames[i+1], players_missing_frames[i+1])

		generateGazeDistanceTSV(players_new_df[i], players_new_df[i+1], data_labels[i], data_labels[i+1],
		(players_noisy_frames[i]|players_off_surface_frames[i]|players_missing_frames[i]),
		(players_noisy_frames[i+1]|players_off_surface_frames[i+1]|players_missing_frames[i+1]))

		# Save for statistics
		players_noisy_list.append(len(players_noisy_frames[i]))
		players_noisy_list.append(len(players_noisy_frames[i+1]))
		players_missing_list.append(len(players_missing_frames[i]))
		players_missing_list.append(len(players_missing_frames[i+1]))

		# To get next two player files
		i += 2

	generateStatisticsCSV(players_noisy_list, players_missing_list)
	prepareLineChart(data_labels)

def cleanNoiseInGivenFrames(data_labels, framesToBeCleared):
	global players_new_df, players_noisy_frames, players_off_surface_frames, players_missing_frames, trackNoiseClearedFrames, player_all_frames, gaze_distance_df

	# Clean noise for each player
	for i in range(0, len(data_labels)):
		prevFrame = 0
		noiseCleared = set()

		framesForThisPlayer = framesToBeCleared[i]

		# For every noisy frame
		for frameNo in players_noisy_frames[i]:

			# If frame number is in set of frames to be cleared
			if frameNo in framesForThisPlayer:
				# Clean noise
				prevFrame = getCleanFrameVal(i, frameNo, prevFrame)
				noiseCleared.add(frameNo)
				trackNoiseClearedFrames[i].add(frameNo)

		# Sort the dataframe by frame number
		sorted(players_new_df[i], key=lambda x: x[0])

		# Removes frames from which noise is cleared
		players_noisy_frames[i] = players_noisy_frames[i]-noiseCleared

	calculateAfterNoiseRemoval(data_labels)


# Noise cleaning file uploaded
@app.route('/cleanNoise', methods=['GET', 'POST'])
def cleanNoise():

	data_labels = (request.get_json())['data_labels']
	frame_intervals = (request.get_json())['frame_intervals']

	# Find frames between which noise is to be cleared
	framesForThisPlayer = set()
	for [start, end] in frame_intervals:
		for i in range(start, end+1):
			framesForThisPlayer.add(i)

	# Same frames to be cleared for all players
	framesToBeCleared = []
	for i in range(len(data_labels)):
		framesToBeCleared.append(framesForThisPlayer)

	cleanNoiseInGivenFrames(data_labels, framesToBeCleared)

	return "200"


def generate_player_col(player_list, player_df):
	new_list = []
	player_df_index = 0

	for [frame_no, val] in player_list:
		if val==100:
			new_list.append("Noisy")
		elif val==10:
			new_list.append("Missing")
		elif val==1:
			new_list.append("Off-surface")
		else:
			new_list.append((str(player_df[player_df_index][1]) + ', ' + str(player_df[player_df_index][2])))
			player_df_index += 1

	return new_list

def generate_gaze_distance_col(gaze_dist_list):
	new_list = []

	for [frame_no, val] in gaze_dist_list:
		if val==1000:
			new_list.append("One player's frame missing")
		elif val==100000:
			new_list.append("Both player's frame missing")
		else:
			new_list.append(val)

	return new_list

# Export data
@app.route('/exportdata', methods=['GET', 'POST'])
def exportData():

	global export_data_count, players_new_df, player_all_frames, gaze_distance_df

	data_labels = (request.get_json())['data_labels']
	data_frames = (request.get_json())['tag_name_dict']

	tag_frames_dict = {}
	for tag_name in data_frames.keys():
		framesForThisTag = set()
		for [start, end] in data_frames[tag_name]:
			for i in range(start, end+1):
				framesForThisTag.add(i)
		tag_frames_dict[tag_name] = framesForThisTag

	# Dictionary to store final c=values for CSV
	res = {}

	# First column: Frame Number
	res["Frame Number"] = [i for i in range(0, total_frames)]

	# Columns for each players (x, y) data
	for i in range(len(data_labels)):
		res[data_labels[i]] = generate_player_col(player_all_frames[i], players_new_df[i])

	# Columns for gaze distance
	i = 0
	while (i<len(data_labels)):
		col_name = 'gaze-distance_' + data_labels[i] + '_' + data_labels[i+1]
		res[col_name] = generate_gaze_distance_col(gaze_distance_df[int(i/2)])
		i += 2

	# Columns for each tag name
	for tagname in data_frames.keys():
		l = []
		for i in range(0, total_frames):
			if i in tag_frames_dict[tagname]:
				l.append(1)
			else:
				l.append(0)
		res[tagname] = l

	export_data_count += 1
	export_data_file_name = 'generated_files/eye_tracking_export_' + str(export_data_count) + '.csv'

	df = pd.DataFrame(res)
	df.to_csv(export_data_file_name, index=False)

	return jsonify({"file_name":export_data_file_name})

def combiningIntervals(start_end,vnum,vnames):
	start_end_frames=[]
	cap_list=[]
	framePerSecond=[]
	maxFps=0

	for i in range(len(vnum)):
		cap=cv2.VideoCapture(vnames[vnum[i]])
		cap_list.append(cap)
		fps = cap.get(cv2.CAP_PROP_FPS)
		framePerSecond.append(fps)
		if maxFps < fps:
			maxFps=fps

		# OpenCV2 version 2 used "CV_CAP_PROP_FPS"
		start=start_end[i][0]
		end=start_end[i][1]
		start_end_frame=[]
		start_end_frame.append(int((fps * start) - fps)) ## start frame
		start_end_frame.append((fps * end))# end frame
		start_end_frames.append(start_end_frame)
	fourcc = cv2.VideoWriter_fourcc(*'MP4V')
	outputFile='CombinedVideo.mp4'
	out = cv2.VideoWriter(outputFile, fourcc, 60.0, (1280, 720))

	for i in range(len(vnum)):
		cap_list[i].set(cv2.CAP_PROP_POS_FRAMES,start_end_frames[i][0])
	for i in range(len(vnum)):
		fps=framePerSecond[i]
		repeat=False

		if fps < maxFps:
			repeat=True
			nRepeat=int(maxFps/fps)

		while(cap_list[i].isOpened()):
			ret, frame = cap_list[i].read()
			if ret:
				h,w,c= frame.shape;

				# resize right img to left size
				frame = cv2.resize(frame,(1280, 720))

				out.write(frame)
				if repeat:
					for j in range(nRepeat):
						out.write(frame)
			frame_number = cap_list[i].get(cv2.CAP_PROP_POS_FRAMES) - 1
			endFidx=start_end_frames[i][1]
			if frame_number > endFidx:
				break
	cap.release()
	out.release()
	cv2.waitKey(0)
	cv2.destroyAllWindows()
	return outputFile


# Combine Video
@app.route('/combinevideo', methods=['GET', 'POST'])
def combineVideo():
	if request.method=='POST':

		video_frames = (request.get_json())['video_name_dict']
		video_list = (request.get_json())['video_sources']
		video_dict={}
		video_number=0
		n = 0
		durations={}

		##Calculate duration of the video
		for video_ in video_list:
			v=cv2.VideoCapture(video_)
			durations[video_]=(v.get(cv2.CAP_PROP_FRAME_COUNT)/v.get(cv2.CAP_PROP_FPS))

		##create dictionary of videos and corresponsing priority for that video
		for video_ in video_list:
			video_dict[video_]=n
			n+=1
			video_number+=1

		start_end=[]
		vnum=[]
		tags=[]

		##create list (videos-number,start, end ) ->  tags
		for video_ in video_list:
			if video_ in video_frames:
				intervalList=video_frames[video_]
				for start,end in intervalList:
					if start>durations[video_]: start=durations[video_]
					if end>durations[video_]: end=durations[video_]
					tags.append(((video_dict[video_]), start, end))

		tags.sort(key=lambda x: x[1])
		for tag in tags:
			vnum.append(tag[0])
			start_end.append((tag[1], tag[2]))

		combined_video_file_name=combiningIntervals(start_end, vnum,video_list) #return "200"
		return jsonify({"file_name":combined_video_file_name})





if __name__ == '__main__':
    print("Listening...")
    app.run(host='127.0.0.1')
