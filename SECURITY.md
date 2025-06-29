# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability within AidMap, please send an email to jeffkazzee@gmail.com. All security vulnerabilities will be promptly addressed.

Please do not open public issues for security vulnerabilities.

## Security Best Practices

### For Contributors

1. **Never commit secrets or API keys**
   - Use environment variables for all sensitive data
   - Run `npm run check:secrets` before committing
   - Check `.env.example` for required variables

2. **Input Validation**
   - Always validate user input on both client and server
   - Use TypeScript types for type safety
   - Sanitize any user-generated content

3. **Dependencies**
   - Run `npm audit` regularly
   - Keep dependencies updated
   - Review dependency licenses

4. **Authentication**
   - All authenticated routes must use Supabase Auth
   - Never store passwords or tokens in localStorage
   - Use secure session management

### Security Checklist for PRs

- [ ] No hardcoded secrets or API keys
- [ ] All user inputs are validated
- [ ] No `console.log` statements with sensitive data
- [ ] Dependencies are up to date
- [ ] TypeScript build passes without errors
- [ ] ESLint passes without warnings
- [ ] No use of `eval()` or `dangerouslySetInnerHTML`
- [ ] Proper error handling that doesn't expose system details

## Data Privacy

- User data is stored securely in Supabase with Row Level Security
- No payment information is stored (demo mode only)
- Location data is only used for community matching
- All data transmission uses HTTPS

## Security Headers

The application implements the following security headers:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict Content Security Policy
- Referrer Policy: strict-origin-when-cross-origin

## Incident Response

In case of a security incident:
1. Immediately notify the maintainers
2. Do not publicly disclose the issue
3. Preserve any evidence
4. Wait for instructions from maintainers

## Demo Mode Notice

This application is currently in demo mode. No real financial transactions are processed. The mock transaction system is for demonstration purposes only.