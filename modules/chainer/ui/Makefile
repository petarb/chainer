# Makefile

DEPTH?=		../../..

JSX?=		${DEPTH}/node_modules/.bin/jsx

all: chainer.js

chainer.js: chainer.jsx
	@echo generating $@..
	@${JSX} <chainer.jsx >$@
CLEAN+=	chainer.js

clean:
	@rm -fv ${CLEAN}
