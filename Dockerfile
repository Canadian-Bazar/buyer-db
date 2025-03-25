FROM node

WORKDIR /

COPY . .

RUN npm install

EXPOSE 909

CMD [ "npm" , "run" , "dev" ]