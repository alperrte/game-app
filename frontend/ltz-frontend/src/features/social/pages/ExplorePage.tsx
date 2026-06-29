import { useCallback, useEffect, useMemo, useState } from "react";

import { Compass, Search, Sparkles, TrendingUp, Users } from "lucide-react";

import { Link, useNavigate } from "react-router-dom";



import { SOCIAL_ROUTES } from "../../../lib/constants";

import { getErrorMessage } from "../../../utils/getErrorMessage";

import { formatSocialTime } from "../../../utils/formatSocialTime";

import { communityService } from "../../community/services/communityService";

import type { Community } from "../../community/types/community.types";

import { socialService } from "../services/socialService";

import type {

  LookingForPlayerPostResponse,

  SocialPostResponse,

} from "../types/social.types";

import { getImageUrl } from "../../user/utils/profileImage";

import { useToast } from "../../../components/ui/toastContext";



type ExploreTab = "communities" | "posts" | "listings";



const PAGE_SIZE = 12;



function sortPopularPosts(posts: SocialPostResponse[]) {

  return [...posts].sort((first, second) => {

    const firstScore = first.likeCount * 2 + first.commentCount;

    const secondScore = second.likeCount * 2 + second.commentCount;

    return secondScore - firstScore;

  });

}



export default function ExplorePage() {

  const [activeTab, setActiveTab] = useState<ExploreTab>("communities");

  const [query, setQuery] = useState("");

  const [loading, setLoading] = useState(true);

  const [loadingMore, setLoadingMore] = useState(false);

  const [communities, setCommunities] = useState<Community[]>([]);

  const [posts, setPosts] = useState<SocialPostResponse[]>([]);

  const [listings, setListings] = useState<LookingForPlayerPostResponse[]>([]);

  const [communityPage, setCommunityPage] = useState(0);

  const [postPage, setPostPage] = useState(0);

  const [listingPage, setListingPage] = useState(0);

  const [hasMoreCommunities, setHasMoreCommunities] = useState(false);

  const [hasMorePosts, setHasMorePosts] = useState(false);

  const [hasMoreListings, setHasMoreListings] = useState(false);

  const { showToast } = useToast();

  const navigate = useNavigate();



  useEffect(() => {

    let active = true;

    void Promise.resolve().then(async () => {

      setLoading(true);

      setCommunityPage(0);

      setPostPage(0);

      setListingPage(0);

      try {

        const [loadedCommunities, loadedPosts, loadedListings] = await Promise.all([

          communityService.getCommunities("", 0, PAGE_SIZE),

          socialService.getPublicPosts({ page: 0, size: PAGE_SIZE }),

          socialService.getOpenLookingForPlayerPosts({ page: 0, size: PAGE_SIZE }),

        ]);

        if (!active) return;

        setCommunities(loadedCommunities);

        setPosts(sortPopularPosts(loadedPosts));

        setListings(loadedListings);

        setHasMoreCommunities(loadedCommunities.length === PAGE_SIZE);

        setHasMorePosts(loadedPosts.length === PAGE_SIZE);

        setHasMoreListings(loadedListings.length === PAGE_SIZE);

      } catch (error) {

        if (active) {

          showToast(getErrorMessage(error, "Keşfet içeriği yüklenemedi."), "error");

        }

      } finally {

        if (active) setLoading(false);

      }

    });

    return () => {

      active = false;

    };

  }, [showToast]);



  const filteredCommunities = useMemo(() => {

    const normalized = query.trim().toLocaleLowerCase("tr");

    if (!normalized) return communities;

    return communities.filter((community) =>

      [community.name, community.description, community.category]

        .filter(Boolean)

        .some((value) => value!.toLocaleLowerCase("tr").includes(normalized)),

    );

  }, [communities, query]);



  const loadMore = useCallback(async () => {

    setLoadingMore(true);

    try {

      if (activeTab === "communities") {

        const nextPage = communityPage + 1;

        const batch = await communityService.getCommunities("", nextPage, PAGE_SIZE);

        setCommunities((current) => [...current, ...batch]);

        setCommunityPage(nextPage);

        setHasMoreCommunities(batch.length === PAGE_SIZE);

      } else if (activeTab === "posts") {

        const nextPage = postPage + 1;

        const batch = await socialService.getPublicPosts({

          page: nextPage,

          size: PAGE_SIZE,

        });

        setPosts((current) => sortPopularPosts([...current, ...batch]));

        setPostPage(nextPage);

        setHasMorePosts(batch.length === PAGE_SIZE);

      } else {

        const nextPage = listingPage + 1;

        const batch = await socialService.getOpenLookingForPlayerPosts({

          page: nextPage,

          size: PAGE_SIZE,

        });

        setListings((current) => [...current, ...batch]);

        setListingPage(nextPage);

        setHasMoreListings(batch.length === PAGE_SIZE);

      }

    } catch (error) {

      showToast(getErrorMessage(error, "Daha fazla içerik yüklenemedi."), "error");

    } finally {

      setLoadingMore(false);

    }

  }, [

    activeTab,

    communityPage,

    listingPage,

    postPage,

    showToast,

  ]);



  const hasMore =

    activeTab === "communities"

      ? hasMoreCommunities

      : activeTab === "posts"

        ? hasMorePosts

        : hasMoreListings;



  const tabs: Array<{ id: ExploreTab; label: string; icon: typeof Users }> = [

    { id: "communities", label: "Topluluklar", icon: Users },

    { id: "posts", label: "Popüler gönderiler", icon: TrendingUp },

    { id: "listings", label: "Oyuncu ilanları", icon: Sparkles },

  ];



  return (

    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8">

      <section className="overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/50 via-zinc-950 to-violet-950/60 p-8">

        <div className="max-w-3xl">

          <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-cyan-300">

            <Compass className="h-4 w-4" /> Keşfet

          </span>

          <h1 className="mt-3 text-4xl font-black text-white">

            Yeni topluluklar, gönderiler ve ilanlar keşfet.

          </h1>

          <p className="mt-3 text-zinc-300">

            Platformdaki herkese açık içerikleri tek sayfada gez; ilgini çeken

            topluluklara katıl veya oyuncu ilanlarına göz at.

          </p>

        </div>

      </section>



      <div className="flex flex-wrap gap-2">

        {tabs.map((tab) => {

          const Icon = tab.icon;

          return (

            <button

              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${

                activeTab === tab.id

                  ? "bg-violet-600 text-white"

                  : "border border-white/10 text-zinc-300 hover:bg-white/5"

              }`}

              key={tab.id}

              onClick={() => setActiveTab(tab.id)}

              type="button"

            >

              <Icon className="h-4 w-4" />

              {tab.label}

            </button>

          );

        })}

      </div>



      {activeTab === "communities" ? (

        <div className="relative">

          <Search className="absolute left-4 top-3.5 h-5 w-5 text-zinc-500" />

          <input

            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-3 pl-12 pr-4 text-white"

            onChange={(event) => setQuery(event.target.value)}

            placeholder="Topluluk ara..."

            value={query}

          />

        </div>

      ) : null}



      {loading ? (

        <p className="text-zinc-400">Yükleniyor...</p>

      ) : activeTab === "communities" ? (

        filteredCommunities.length > 0 ? (

          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

            {filteredCommunities.map((community) => (

              <article

                className="cursor-pointer overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 transition hover:border-violet-500/40"

                key={community.id}

                onClick={() =>

                  navigate(SOCIAL_ROUTES.communityDetail(community.id))

                }

              >

                <div

                  className="h-32 bg-gradient-to-br from-violet-700/50 to-fuchsia-700/20 bg-cover bg-center"

                  style={

                    community.imageUrl

                      ? {

                          backgroundImage: `url(${getImageUrl(community.imageUrl)})`,

                        }

                      : undefined

                  }

                />

                <div className="space-y-3 p-5">

                  <div>

                    <h2 className="text-xl font-black text-white">{community.name}</h2>

                    <p className="mt-1 text-xs font-bold uppercase tracking-wider text-violet-300">

                      {community.category || "Genel"}

                    </p>

                  </div>

                  <p className="line-clamp-2 text-sm text-zinc-400">

                    {community.description}

                  </p>

                  <p className="text-sm text-zinc-300">{community.memberCount} üye</p>

                </div>

              </article>

            ))}

          </section>

        ) : (

          <p className="text-zinc-500">Gösterilecek topluluk bulunamadı.</p>

        )

      ) : activeTab === "posts" ? (

        posts.length > 0 ? (

          <section className="space-y-4">

            {posts.map((post) => (

              <article

                className="cursor-pointer rounded-2xl border border-white/10 bg-zinc-950 p-5 transition hover:border-violet-500/30"

                key={post.id}

                onClick={() => navigate(SOCIAL_ROUTES.postDetail(post.id))}

              >

                <p className="text-xs text-zinc-500">{formatSocialTime(post.createdAt)}</p>

                <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm text-zinc-100">

                  {post.content}

                </p>

                <p className="mt-3 text-xs text-zinc-500">

                  {post.likeCount} beğeni · {post.commentCount} yorum

                  {post.communityName ? ` · ${post.communityName}` : ""}

                </p>

              </article>

            ))}

          </section>

        ) : (

          <p className="text-zinc-500">Popüler gönderi bulunamadı.</p>

        )

      ) : listings.length > 0 ? (

        <section className="grid gap-4 md:grid-cols-2">

          {listings.map((listing) => (

            <article

              className="rounded-2xl border border-white/10 bg-zinc-950 p-5"

              key={listing.id}

            >

              <p className="text-xs font-bold uppercase tracking-wider text-fuchsia-300">

                Oyuncu aranıyor

              </p>

              <h2 className="mt-2 text-lg font-black text-white">{listing.title}</h2>

              {listing.description ? (

                <p className="mt-2 line-clamp-3 text-sm text-zinc-400">

                  {listing.description}

                </p>

              ) : null}

              <p className="mt-3 text-xs text-zinc-500">

                {listing.platform}

                {listing.preferredRole ? ` · ${listing.preferredRole}` : ""}

              </p>

            </article>

          ))}

        </section>

      ) : (

        <p className="text-zinc-500">Açık oyuncu ilanı bulunamadı.</p>

      )}



      {!loading && hasMore ? (

        <div className="text-center">

          <button

            className="rounded-xl border border-violet-500/40 px-6 py-3 font-bold text-violet-200 disabled:opacity-50"

            disabled={loadingMore}

            onClick={() => void loadMore()}

            type="button"

          >

            {loadingMore ? "Yükleniyor..." : "Daha fazla yükle"}

          </button>

        </div>

      ) : null}



      <div className="text-center">

        <Link

          className="text-sm font-semibold text-violet-400 hover:text-violet-300"

          to={SOCIAL_ROUTES.feed}

        >

          Ana akışa dön

        </Link>

      </div>

    </main>

  );

}


