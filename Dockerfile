FROM node:14 AS builder
WORKDIR /app
COPY package*.json ./
COPY gulpfile.js ./
COPY .eslint* ./
COPY .stylelintrc.json ./
COPY static ./static/
RUN npm install
RUN ./node_modules/.bin/gulp build
RUN npm run lint:js -- --max-warnings=0
RUN npm run lint:css

FROM python:3.7.9

ARG CIRCLE_BRANCH
ARG CIRCLE_SHA1
ARG CIRCLE_TAG
ENV CIRCLE_BRANCH=${CIRCLE_BRANCH:-unknown} \
    CIRCLE_TAG=${CIRCLE_TAG:-unknown} \
    CIRCLE_SHA1=${CIRCLE_SHA1:-unknown}

RUN apt-get update && apt-get install -y libpq-dev
RUN pip install --upgrade pip

RUN groupadd --gid 10001 app && \
    useradd -g app --uid 10001 --shell /usr/sbin/nologin --create-home --home-dir /app app

WORKDIR /app

EXPOSE 8000

USER app
COPY --from=builder --chown=app /app/static ./static

COPY --chown=app ./requirements.txt /app/requirements.txt
RUN pip install -r requirements.txt
# When the user's Accept-Language is set to `fy`, Django's LocaleMiddleware
# doesn't load `fy-NL`. This is a workaround to force the Frysian and Swedish
# localisations to load anyway when appropriate.
COPY --chown=app . /app
RUN ln --symbolic /app/privaterelay/locales/fy-NL/ privaterelay/locales/fy
RUN ln --symbolic /app/privaterelay/locales/sv-SE/ privaterelay/locales/sv
COPY --chown=app .env-dist /app/.env

RUN mkdir -p /app/staticfiles
RUN python manage.py collectstatic --no-input -v 2

ENTRYPOINT ["/app/.local/bin/gunicorn"]

CMD ["--config", "gunicorn.conf", "privaterelay.wsgi:application"]
