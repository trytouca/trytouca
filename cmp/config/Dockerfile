# ---- builder ----

FROM ubuntu:focal AS builder

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

COPY comparator /opt/comparator

RUN chown -v -R weasel:weasel /opt
WORKDIR /opt
USER weasel

RUN conan profile new default --detect \
  && conan profile update settings.compiler.libcxx=libstdc++11 default \
  && conan remote add --force weasel-conan https://api.bintray.com/conan/getweasel/weasel-cpp \
  && cd /opt/comparator && ./build.sh

# ---- production ----

FROM ubuntu:focal

LABEL maintainer="hello@getweasel.com"
LABEL org.opencontainers.image.title="weasel-comparator"
LABEL org.opencontainers.image.description="Weasel Server Comparator"
LABEL org.opencontainers.image.url="https://getweasel.com/"
LABEL org.opencontainers.image.documentation="https://docs.getweasel.com"
LABEL org.opencontainers.image.vendor="Weasel, Inc."
LABEL org.opencontainers.image.authors="hello@getweasel.com"

COPY --from=builder /opt/comparator/local/dist /usr/local
COPY --from=builder /opt/comparator/config/config.prod.json /usr/local/etc/comparator.json

CMD [ "/usr/local/bin/weasel_cmp", "--config-file=/usr/local/etc/comparator.json" ]
