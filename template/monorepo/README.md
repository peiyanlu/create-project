# $PACKAGE_NAME


$DESCRIPTION


## Project setup

```bash
$ pnpm i
```

$START


## Run tests

```bash
# unit tests
$ $RUN test

# e2e tests
$ $RUN test:e2e

# test coverage
$ $RUN test:cov
```

$END

### Changesets

```shell
#安装初始化
pnpm add -D @changesets/cli
pnpm changeset init

#代码变更后
pnpm changeset

#发布版本
pnpm changeset version
pnpm changeset publish --access public
```
