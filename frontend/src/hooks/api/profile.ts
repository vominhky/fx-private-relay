import useSWR, { Fetcher, SWRResponse } from "swr";
import { DateString } from "../../functions/parseDate";
import { apiFetch, authenticatedFetch } from "./api";

export type ProfileData = {
  id: number;
  server_storage: boolean;
  has_premium: boolean;
  subdomain: string | null;
  onboarding_state: number;
  avatar: string;
  date_subscribed: null | DateString;
  next_email_try: DateString;
  bounce_status: [false, ""] | [true, "soft"] | [true, "hard"];
  api_token: string;
};

export type ProfilesData = [ProfileData];

export type ProfileUpdateFn = (
  id: ProfileData["id"],
  data: Partial<ProfileData>
) => Promise<Response>;

/**
 * Fetch the user's profile data from our API using [SWR](https://swr.vercel.app).
 */
export function useProfiles(): SWRResponse<ProfilesData, unknown> & {
  update: ProfileUpdateFn;
} {
  const profiles = useSWR("/profiles/", profileFetcher, {
    revalidateOnFocus: false,
  }) as SWRResponse<ProfilesData, Error>;

  const update: ProfileUpdateFn = async (id, data) => {
    const response = await apiFetch(`/profiles/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    profiles.mutate();
    return response;
  };

  return {
    ...profiles,
    update: update,
  };
}

/**
 * Instead of using the `fetcher` from `api.ts`, this fetcher is specific to the profiles API.
 * The reason that it's needed is that we have to tell the back-end to re-fetch data from
 * Firefox Accounts if the user was sent back here after trying to subscribe to Premium.
 */
const profileFetcher = async (
  url: string,
  requestInit: RequestInit
): Promise<ProfilesData> => {
  const isToldByFxaToRefresh =
    document.location.search.indexOf("fxa_refresh=1") !== -1;

  if (isToldByFxaToRefresh) {
    const refreshResponse = await authenticatedFetch(
      "/accounts/profile/refresh"
    );
    await refreshResponse.json();
  }

  const response = await apiFetch(url, requestInit);
  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }
  const data: ProfilesData = await response.json();
  return data;
};
