FROM node:14

WORKDIR /app 

COPY package.json /app 
COPY yarn.lock /app

RUN yarn install --production

COPY . /app 

ENV CLOUD_ENV=production \
    MONGO_DB=connektCamp \
    ALLOWED_ORIGINS=https://connekt.camp,https://connekt-camp-site.netlify.app,https://connekt-camp-payment-fcjuh3h5uq-el.a.run.app,https://payment.connekt.camp

CMD [ "yarn", "start" ]
