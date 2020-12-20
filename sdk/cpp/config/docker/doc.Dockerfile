FROM alpine:3.8

RUN apk add --update --no-cache \
  bash doxygen python3 python3-dev \
  && pip3 install --no-cache-dir --upgrade pip \
  && pip3 install --upgrade --no-cache-dir \
    breathe m2r2 sphinx==3.2.1 sphinx-rtd-theme \
  && rm -rf /var/lib/apt/lists/*

COPY clients/cpp /opt/clients/cpp
COPY docs /opt/docs
COPY config/flatbuffers /opt/config/flatbuffers

RUN cd /opt/clients/cpp && bash build.sh --docs
