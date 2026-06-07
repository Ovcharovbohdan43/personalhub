import { Card } from '@/components/ui/card';
import { ProfileForm } from '@/components/profile/profile-form';
import { AvatarUpload } from '@/components/profile/avatar-upload';
import { getProfile } from '@/modules/profile/queries';
import { getPageLocale } from '@/i18n/page';

export default async function ProfilePage({ params }: { params: Promise<{ lang: string }> }) {
  const [{ dictionary: dict }, { user, profile }] = await Promise.all([getPageLocale(params), getProfile()]);
  const name = profile?.display_name ?? user?.email ?? '?';

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">{dict.profile.title}</h1>
        <p className="text-sm text-muted-foreground">{dict.profile.subtitle}</p>
      </div>
      <Card className="min-w-0 p-4 sm:p-6">
        <div className="mb-6 flex flex-col items-center gap-4">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" className="h-28 w-28 rounded-full object-cover" />
          ) : (
            <div className="grid h-28 w-28 place-items-center rounded-full bg-gradient-to-br from-orange-300 to-red-400 text-3xl font-bold">
              {name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <AvatarUpload />
        </div>
        <ProfileForm profile={profile} email={user?.email ?? ''} />
      </Card>
    </div>
  );
}
