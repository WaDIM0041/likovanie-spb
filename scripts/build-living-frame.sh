#!/usr/bin/env bash
set -euo pipefail
# Stable rehearsal shot: freeze the room and other dancers, move only the right-hand dancer.
ffmpeg -hide_banner -loglevel error -ss 7.4 -t 0.8 -i research/videos/1.mp4 \
  -filter_complex '[0:v]scale=960:540,fps=24,split=3[a][b][c];[a]setpts=2*(PTS-STARTPTS)[f];[b]reverse,setpts=2*(PTS-STARTPTS)[r];[f][r]concat=n=2:v=1:a=0,format=gbrp[moving];[c]trim=end_frame=1,setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration=5,format=gbrp[still];color=c=black:s=960x540:r=24:d=5,format=gbrp,drawbox=x=670:y=35:w=190:h=445:color=white:t=fill,gblur=sigma=12[mask];[still][moving][mask]maskedmerge,trim=duration=3.15,setpts=PTS-STARTPTS,format=yuv420p[out]' \
  -map '[out]' -an -r 24 -c:v libx264 -crf 24 -preset slow -movflags +faststart -y research/videos/living-frame.mp4
ffmpeg -hide_banner -loglevel error -i research/videos/living-frame.mp4 -frames:v 1 -q:v 3 -y research/assets/living-frame.jpg
