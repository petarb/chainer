# Makefile

SUBDIR+=	modules/chainer/lib
SUBDIR+=	modules/chainer/ui

TARGETS+=	all
TARGETS+=	clean

$(TARGETS):
	@for i in $(SUBDIR); do echo $$i; \
		(cd $$i && $(MAKE) $@) || exit 1; done

all: node-check node_modules

node-check:
	@node -v >/dev/null 2>/dev/null || \
		(echo please install node.js && exit 1)
.PHONY:	node-check

node_modules:
	@echo extracting node_modules..
	@tar xzf node_modules.tgz

distclean: clean
	@echo removing node_modules..
	@rm -rf node_modules
.PHONY:	distclean

-include Makefile.inc
