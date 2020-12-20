FROM alpine:3.8

LABEL maintainer="pejman@ghorbanzade.com"

RUN apk add --update --no-cache \
  bash doxygen python3 python3-dev \
  && pip3 install --no-cache-dir --upgrade pip \
  && pip3 install --upgrade --no-cache-dir \
    breathe m2r2 sphinx==3.2.1 sphinx-rtd-theme \
  && rm -rf /var/lib/apt/lists/*

COPY . /opt

WORKDIR /opt

RUN bash build.sh --docs
