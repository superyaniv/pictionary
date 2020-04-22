!/bin/bash
# Run Docker Commands
RIGHT_NOW=$(date +"%x %r %Z")
TIME_STAMP="Updated on $RIGHT_NOW by $USER"
ECHO $TIME_STAMP
ECHO -n 'Do you want to remove the previous container image? (y/n)>'
READ RESPONSE_REMOVE
IF [ $RESPONSE_REMOVE == 'y' ]
THEN
  docker ps
  ECHO -n 'What is the name of the container image? (first 3 letters, or blank for no image) >'
  READ CONTAINER_NAME
  $CONTAINER_NAME_LENGTH=${#CONTAINER_NAME}   
  IF [ $CONTAINER_NAME_LENGTH -gt 0 ]
  THEN
    ECHO 'Stopping Docker Container...'
    docker stop $CONTAINER_NAME
    ECHO 'Docker Image stopped'
  ELSE
    ECHO 'OK'
ELSE
  ELSE 'OK'
FI
ECHO -n 'Do you want to pull the latest Docker? (y/n) >'
READ RESPONSE_PULL
IF [ $RESPONSE_PULL == 'y' ]
THEN
  ECHO 'Pulling Docker...'
  docker pull yanivalfasy/pictionary
ELSE
  ECHO 'OK'
FI
ECHO ''
ECHO 'TO RUN COMMAND: docker run -d -v ~/keys:/usr/src/app/keys -p 5000:5000 -p 5443:5443 yanivalfasy/pictionary:latest'
ECHO -n 'Do you want to build the docker image? (y/n) >'
READ RESPONSE_BUILD
IF [ $RESPONSE_BUILD == 'y' ]
THEN
  ECHO 'Running Docker'
  docker run -d -v ~/logs:/usr/src/app/logs -p 5000:5000 -p 5443:5443 yanivalfasy/pictionary:latest
ELSE
  ECHO 'OK'
FI
ECHO ''
ECHO 'All Commands. Done.'
EXIT 1
