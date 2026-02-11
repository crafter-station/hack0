# External Links Security Audit

## Issue: HCK0-63

**Date**: 2025-02-11
**Auditor**: Bolt
**Scope**: Footer external links security attributes

## Summary

Verified that all external links in the footer component use proper security attributes to prevent tabnabbing attacks.

## Findings

### Site Footer (`components/layout/site-footer.tsx`)

All external links with `target="_blank"` correctly include `rel="noopener noreferrer"`:

1. **GitHub Link** (Line 80-87)
   - URL: `https://github.com/crafter-station/hack0`
   - Attributes: ✅ `target="_blank"` + `rel="noopener noreferrer"`

2. **Crafter Station Link** (Line 100-108)
   - URL: `https://www.crafterstation.com/`
   - Attributes: ✅ `target="_blank"` + `rel="noopener noreferrer"`

## Security Best Practices

Both links follow security best practices:
- `rel="noopener"` - Prevents the new page from accessing `window.opener`
- `rel="noreferrer"` - Prevents the browser from sending the referrer header

## Status

✅ **PASSED** - All external links in footer are properly secured against tabnabbing attacks.

## References

- [OWASP: Reverse Tabnabbing](https://owasp.org/www-community/attacks/Reverse_Tabnabbing)
- [MDN: rel=noopener](https://developer.mozilla.org/en-US/docs/Web/HTML/Link_types/noopener)
