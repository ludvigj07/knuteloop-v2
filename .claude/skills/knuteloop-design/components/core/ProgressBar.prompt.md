Progress track + fill for badge-tier progress, knute-folder completion, and onboarding steps.

```jsx
<ProgressBar value={8} max={15} tone="accent" showLabel label="Knutesamler" />
<ProgressBar value={62} tone="primary" />
```

`tone`: `primary | accent | success`. Set `showLabel` for a label + count row. Ink-bordered rounded track, fill animates on width change.
