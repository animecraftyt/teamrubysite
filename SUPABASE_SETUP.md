# Team Ruby Games Accounts

The site is static, so account authentication and cross-device inventory use Supabase. Passwords are handled by Supabase Auth; the site never stores them. Inventory rows are protected by row-level security and are accessible only to their owner.

## Setup

1. Create a Supabase project and enable email/password authentication.
2. In the Supabase SQL Editor, run `supabase/schema.sql` once.
3. In Supabase project settings, copy the Project URL and the publishable client key (or legacy anon key). Put them in `assets/js/supabase-config.js`:

   ```js
   window.TEAM_RUBY_SUPABASE_CONFIG = {
       url: "https://YOUR_PROJECT_REF.supabase.co",
       anonKey: "YOUR_PUBLIC_PUBLISHABLE_OR_ANON_KEY"
   };
   ```

4. Set the Supabase Site URL and allowed redirect URLs to the hosted Team Ruby site so email confirmation links return to the site.
5. Publish the site over HTTPS, then test signup, email confirmation, sign-in, a shop purchase, and inventory sync in a second browser tab.

The publishable/anon key is designed to be used in browser code. Never put a Supabase `service_role` or secret key in this site.

## Account behavior

Players sign up with an email, username, and password, then sign in with email and password. Supabase sends any configured email confirmation. Usernames are limited to 3-16 letters, numbers, or underscores and are unique. Box Bucks, potions, and revives sync to the signed-in account. Guest purchases continue to work locally until the Supabase project is configured.
