# ---- builder stage ----

FROM ubuntu:focal as builder

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    apt-transport-https ca-certificates gnupg software-properties-common wget \
  && wget -O - https://apt.kitware.com/keys/kitware-archive-latest.asc 2>/dev/null \
    | gpg --dearmor - | tee /etc/apt/trusted.gpg.d/kitware.gpg >/dev/null \
  && apt-add-repository 'deb https://apt.kitware.com/ubuntu/ focal main' \
  && apt-get install -y --no-install-recommends \
    cmake g++ gcc make python3-pip python3-setuptools \
  && apt-get install -y --no-install-recommends \
    xorg-dev libx11-xcb-dev libxcb-render0-dev libxcb-render-util0-dev \
    libxcb-xkb-dev libxcb-icccm4-dev libxcb-image0-dev libxcb-keysyms1-dev \
    libxcb-randr0-dev libxcb-shape0-dev libxcb-sync-dev libxcb-xfixes0-dev \
    libxcb-xinerama0-dev xkb-data libxcb-dri3-dev libxcb-util-dev \
  && rm -rf /var/lib/apt/lists/* \
  && pip3 install conan --no-cache-dir --upgrade \
  && cmake --version \
  && conan --version \
  && groupadd -r weasel && useradd -u 8002 -m --no-log-init -r -g weasel weasel

COPY cmp /opt/cmp
RUN chown -v -R weasel:weasel /opt
WORKDIR /opt
USER weasel

RUN conan profile new default --detect \
  && conan profile update settings.compiler.libcxx=libstdc++11 default \
  && conan remote add --force weasel-cpp https://getweasel.jfrog.io/artifactory/api/conan/weasel-cpp \
  && cd /opt/cmp && ./build.sh

# ---- production image ----

FROM ubuntu:focal

COPY --from=builder /opt/cmp/local/dist                 /usr/local
COPY --from=builder /opt/cmp/config/config.prod.json    /usr/local/etc/config.json

CMD [ "/usr/local/bin/weasel_cmp", "--config-file=/usr/local/etc/config.json" ]
