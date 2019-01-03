// Necessary packages
const RendererContext = require('../renderer-context.js');

/**
 * Class used create context
 * for the homepage theme view
 */

class RendererContextHome extends RendererContext {
    loadData() {
        // prepare query variables
        this.postsNumber = parseInt(this.postsNumber, 10);
        this.offset = parseInt(this.offset, 10);

        // Retrieve post
        let includeFeaturedPosts = '';

        if(this.themeConfig.renderer && !this.themeConfig.renderer.includeFeaturedInPosts) {
            includeFeaturedPosts = 'status NOT LIKE "%featured%" AND';
        }

        if(this.postsNumber === -1) {
            this.postsNumber = 999;
        }

        if(this.postsNumber === 0) {
            this.posts = false;
        } else {
            this.posts = this.db.prepare(`
                SELECT
                    *
                FROM
                    posts
                WHERE
                    ${includeFeaturedPosts}
                    status LIKE "%published%" AND
                    status NOT LIKE "%hidden%" AND
                    status NOT LIKE "%trashed%"
                ORDER BY
                    ${this.postsOrdering}
                LIMIT
                    @postsNumber
                OFFSET
                    @offset
            `).all({
                postsNumber: postsNumber,
                offset: this.offset  
            });
        }

        let siteName = this.siteConfig.name;

        if(this.siteConfig.displayName) {
            siteName = this.siteConfig.displayName;
        }

        this.metaTitle = this.siteConfig.advanced.metaTitle.replace(/%sitename/g, siteName);
        this.metaDescription = this.siteConfig.advanced.metaDescription;

        this.tags = this.renderer.commonData.tags;
        this.menus = this.renderer.commonData.menus;
        this.unassignedMenus = this.renderer.commonData.unassignedMenus;
        this.authors = this.renderer.commonData.authors;
        this.featuredPosts = this.renderer.commonData.featuredPosts.homepage;
        this.hiddenPosts = this.renderer.commonData.hiddenPosts;
    }

    prepareData() {
        this.title = this.siteConfig.name;
        this.posts = this.posts.map(post => this.renderer.cachedItems.posts[post.id]);
        this.featuredPosts = this.featuredPosts.map(post => this.renderer.cachedItems.posts[post.id]);
        this.hiddenPosts = this.hiddenPosts.map(post => this.renderer.cachedItems.posts[post.id]);

        // Remove featured posts from posts if featured posts not allowed
        if(
            this.themeConfig.renderer &&
            this.themeConfig.renderer.includeFeaturedInPosts &&
            (
                this.themeConfig.renderer.featuredPostsNumber > 0 ||
                this.themeConfig.renderer.featuredPostsNumber === -1
            )
        ) {
            let featuredPostsIds = this.featuredPosts.map(post => post.id);
            this.posts = this.posts.filter(post => featuredPostsIds.indexOf(post.id) === -1);
        }
    }

    setContext() {
        this.loadData();
        this.prepareData();

        let metaRobotsValue = this.siteConfig.advanced.metaRobotsIndex;

        if(this.siteConfig.advanced.noIndexThisPage) {
            metaRobotsValue = 'noindex,nofollow';
        }

        this.context = {
            title: this.metaTitle !== '' ? this.metaTitle : this.title,
            posts: this.posts,
            featuredPosts: this.featuredPosts,
            hiddenPosts: this.hiddenPosts,
            tags: this.tags,
            authors: this.authors,
            metaTitleRaw: this.metaTitle,
            metaDescriptionRaw: this.metaDescription,
            metaRobotsRaw: metaRobotsValue,
            siteOwner: this.renderer.cachedItems.authors[1],
            menus: this.menus,
            unassignedMenus: this.unassignedMenus
        };
    }

    getContext(offset = 0, postsNumber = 999) {
        this.offset = offset;
        this.postsNumber = postsNumber;
        this.setContext();

        return this.context;
    }

    getPostsNumber() {
        let includeFeaturedPosts = '';

        if(this.themeConfig.renderer && !this.themeConfig.renderer.includeFeaturedInPosts) {
            includeFeaturedPosts = 'AND status NOT LIKE "%featured%"';
        }

        let results = this.db.prepare(`
            SELECT
                COUNT(id)
            FROM
                posts
            WHERE
                status LIKE "%published%"
                AND
                status NOT LIKE "%hidden%"
                AND
                status NOT LIKE "%trashed%"
                ${includeFeaturedPosts}
            GROUP BY
                id
        `).all();

        if(!results || !results.length) {
            return 0;
        }

        return results.length;
    }
}

module.exports = RendererContextHome;
