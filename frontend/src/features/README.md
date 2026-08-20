# features/

One folder per spec module. Keep a feature self-contained:

```
features/medications/
  components/       UI used only by this feature
  hooks/            data-fetching and state hooks
  api.js            calls into src/api
  slice.js          redux slice or context reducer
  index.js          public exports
```

Cross-feature UI moves up into `src/components/common/`.
