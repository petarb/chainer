# Makefile

DEPTH?=		../../..

PEGJS?=		${DEPTH}/node_modules/.bin/pegjs
WEBMAKE?=	${DEPTH}/node_modules/.bin/webmake
UGLIFY?=	${DEPTH}/node_modules/.bin/uglifyjs

all: chainer-lib.js

parser.js: parser.pegjs
	@echo generating $@..
	@${PEGJS} --cache <parser.pegjs >$@
CLEAN+=	parser.js

chainer-mod.js: chainer.js parser.js
	@echo generating $@..
	@awk 'BEGIN { \
		print "module.exports = (function () {"; \
	} { \
		if ($$0 ~ /^function /) { \
			f[i++] = $$2; \
		} \
		print \
	} END { \
		print "return {"; \
		for (j=0; j<i; j++) { \
			printf("%s: %s", f[j], f[j]); \
			print (j<i-1) ?"," :"}"; \
		} \
		print "})()"; \
	}' chainer.js >$@
CLEAN+=	chainer-mod.js

chainer-lib.js: chainer-mod.js
	@echo generating $@..
	@${WEBMAKE} $> $^ | ${UGLIFY} -b | \
		sed '1s/.*/var Chainer = &/' >$@
CLEAN+=	chainer-lib.js

clean:
	@rm -fv ${CLEAN}
