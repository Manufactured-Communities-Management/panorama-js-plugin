FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl unzip groff less \
    python3 python3-dev python3-venv python3-pip python3-numpy hugin-tools \
    zlib1g-dev libjpeg-dev libpng-dev libwebp-dev \
 && rm -rf /var/lib/apt/lists/*

RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

RUN pip3 install pillow
RUN pip3 install scipy
RUN pip3 install psutil

RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
	./aws/install

RUN export PYTHONDONTWRITEBYTECODE=1
ENV PYTHONDONTWRITEBYTECODE=1

ADD basisu/basisu /basisu

ADD generate.py /generate.py
ADD generate_utils.py /generate_utils.py

RUN sed -i 's/\r//' /generate.py /generate_utils.py

RUN python3 -m py_compile /generate_utils.py
RUN python3 -m py_compile /generate.py

ENTRYPOINT ["python3", "/generate.py"]
