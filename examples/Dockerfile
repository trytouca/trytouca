FROM ubuntu:focal

LABEL maintainer="hello@getweasel.com"
LABEL org.opencontainers.image.title="weasel-examples"
LABEL org.opencontainers.image.description="Sample Regression Test Tools using Weasel"
LABEL org.opencontainers.image.url="https://getweasel.com/"
LABEL org.opencontainers.image.documentation="https://getweasel.com/docs"
LABEL org.opencontainers.image.vendor="Pejman Ghrobanzade"
LABEL org.opencontainers.image.authors="hello@getweasel.com"
LABEL org.opencontainers.image.licenses="https://github.com/getweasel/examples/blob/master/LICENSE"

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    apt-transport-https ca-certificates gnupg software-properties-common wget \
  && wget -O - https://apt.kitware.com/keys/kitware-archive-latest.asc 2>/dev/null \
    | gpg --dearmor - | tee /etc/apt/trusted.gpg.d/kitware.gpg >/dev/null \
  && apt-add-repository 'deb https://apt.kitware.com/ubuntu/ focal main' \
  && apt-get install -y --no-install-recommends \
    cmake g++ gcc make python3-pip python3-setuptools \
  && rm -rf /var/lib/apt/lists/* \
  && pip3 install conan --no-cache-dir --upgrade \
  && cmake --version \
  && conan --version \
  && groupadd -r weasel && useradd -u 8002 -m --no-log-init -r -g weasel weasel

COPY . /opt

RUN chown -v -R weasel:weasel /opt

WORKDIR /opt

USER weasel

RUN conan profile new default --detect \
  && conan profile update settings.compiler.libcxx=libstdc++11 default \
  && conan remote add --force weasel-conan https://api.bintray.com/conan/getweasel/weasel-cpp \
  && ./build.sh
