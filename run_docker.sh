!/bin/bash
# Run Docker Commands
RIGHT_NOW=$(date +"%x %r %Z")
TIME_STAMP="Updated on $RIGHT_NOW by $USER"
echo $TIME_STAMP
echo -n 'Do you want to remove the previous container image? (y/n)>'
read RESPONSE_REMOVE
if [ $RESPONSE_REMOVE == 'y' ]
then
	docker ps
	echo -n 'What is the name of the container image? (first 3 letters, or blank for no image) >'
	read CONTAINER_NAME
	echo 'Stopping Docker Container...'
	docker stop $CONTAINER_NAME
	echo 'Docker Image stopped'
else
	echo 'OK'
fi
echo -n 'Do you want to pull the latest Docker? (y/n) >'
read RESPONSE_PULL
if [ $RESPONSE_PULL == 'y' ]
then
	echo 'Pulling Docker...'
	docker pull yanivalfasy/pictionary
else
	echo 'OK'
fi
echo ''
echo 'TO RUN COMMAND: docker run -d -v ~/keys:/usr/src/app/keys -p 5000:5000 -p 5443:5443 yanivalfasy/pictionary:latest'
echo -n 'Do you want to build the docker image? (y/n) >'
read RESPONSE_BUILD
if [ $RESPONSE_BUILD == 'y' ]
then
	echo 'Running Docker'
	docker run -d -v ~/keys:/usr/src/app/keys -p 5000:5000 -p 5443:5443 yanivalfasy/pictionary:latest
else
	echo 'OK'
fi
echo ''
echo '-----docker containers running-----'
docker ps
echo '-----docker containers running-----'
echo ''
echo 'All Commands. Done.'
exit 1
