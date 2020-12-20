# ---- builder ----

FROM ubuntu:bionic AS builder

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    apt-transport-https ca-certificates gnupg software-properties-common wget \
  && wget -O - https://apt.kitware.com/keys/kitware-archive-latest.asc 2>/dev/null \
    | gpg --dearmor - | tee /etc/apt/trusted.gpg.d/kitware.gpg >/dev/null \
  && apt-add-repository 'deb https://apt.kitware.com/ubuntu/ bionic main' \
  && apt-get install -y --no-install-recommends \
    cmake g++ gcc make python3-pip python3-setuptools \
  && rm -rf /var/lib/apt/lists/* \
  && pip3 install conan --no-cache-dir --upgrade \
  && cmake --version \
  && conan --version \
  && groupadd -r weasel && useradd -u 8002 -m --no-log-init -r -g weasel weasel

COPY clients/cpp /opt/clients/cpp
COPY comparator /opt/comparator
COPY config/flatbuffers /opt/config/flatbuffers

RUN chown -v -R weasel:weasel /opt
WORKDIR /opt
USER weasel

RUN conan profile new default --detect \
  && conan profile update settings.compiler.libcxx=libstdc++11 default \
  && cd /opt/clients/cpp && ./build.sh \
  && cd /opt/comparator && ./build.sh

# ---- production ----

FROM ubuntu:bionic

LABEL maintainer="pejman@ghorbanzade.com"

COPY --from=builder /opt/comparator/local/dist /usr/local
COPY --from=builder /opt/comparator/config/config.prod.ini /usr/local/etc/comparator.ini

CMD [ "/usr/local/bin/weasel_cmp", "--config-file=/usr/local/etc/comparator.ini" ]
