// Shared by the rendered React pages and the initial crawlable HTML.
export const platformGuides = {
  youtube: {
    copy:'On YouTube, copy the Share link for one public video or Short. Standard watch links, Shorts links and youtu.be links are accepted. Channel homepages, search pages and playlists are not individual video links. After analysis, compare the listed formats and choose one at or below 480p; this cap reflects the formats that have worked reliably in the current Savyour setup. A thumbnail and title can appear even if the media stream is refused later. If saving stalls, try another available format, confirm the video plays publicly in your region, and check that the source does not require sign-in. Savyour does not bypass account or regional restrictions.',
    problem:'The video has no format at or below 480p, or YouTube exposes details but refuses the stream.'
  },
  tiktok: {
    copy:'Use the Share button on an individual public TikTok video and copy its video link. A profile URL points to a creator rather than a specific post, so it cannot identify the media to save. Savyour reads the post details, displays its thumbnail when the source provides one, and lists the accessible formats. The best option reflects what the source exposes for that particular video; it is not a promise of a fixed resolution or watermark treatment. If analysis fails, check whether the post is still public and accessible without a TikTok account. Region restrictions, deleted posts, and changes to TikTok access can affect one video while another works.',
    problem:'A private, removed, or account-restricted post cannot expose its media to the public downloader.'
  },
  instagram: {
    copy:'Open the public Reel or video post itself and copy its link, usually under /reel/ or /p/. An Instagram profile link does not select a single video. Savyour checks the post and shows the thumbnail and available quality choices when the source permits access. A post may look public in your signed-in Instagram app but still require an account when opened by the server. If the thumbnail appears and saving fails, the preview may have been accessible while the video stream was not. Try the original post URL and confirm it opens in a private browser window without signing in. Stories, private accounts and access restricted posts are outside this public-link flow.',
    problem:'Instagram may return post metadata while requiring sign-in for the actual video stream.'
  },
  facebook: {
    copy:'Copy a direct link to a public Facebook video or use its fb.watch share link. A feed, group or profile URL does not identify a specific playable post. When the post is accessible, Savyour displays the preview and the formats returned by the source. Audience settings matter: videos shared only with friends, members of a group or signed-in viewers can fail even when you personally see them in Facebook. If analysis cannot find media, open the link while signed out and confirm the video itself is public. The best available quality varies with the post and its accessible streams; the site cannot raise the original resolution.',
    problem:'Friends-only and group-limited audiences often allow the sender to view a post but block a public downloader.'
  },
  x: {
    copy:'Use the share link for the individual X post containing the video. Both x.com and twitter.com post URLs are accepted; a profile or search URL is not a video post. After analysis, check whether a thumbnail and video formats are listed. Some posts contain only an image, link preview or externally hosted embed, and therefore offer no native video file to save. A public-looking post may also require sign-in, be deleted or be unavailable in the server’s region. If a format does appear, select the best accessible option or a specific listed format. Savyour does not access protected accounts or work around restrictions imposed by X.',
    problem:'The post contains no native video, or the source requires a signed-in viewer for its media.'
  },
  vimeo: {
    copy:'Copy the URL of an individual Vimeo video that its owner has made publicly accessible. A creator profile, showcase or private review link may have different access rules and is not a normal public video link. Savyour checks the video details and lists the streams it can actually reach. Vimeo creators can control viewing and download availability, so a playable thumbnail does not necessarily mean that the file can be saved here. If the download fails, check the owner’s access settings and use an official download option offered on the Vimeo page where applicable. Quality choices depend on the streams available for that video, and no format is manufactured by Savyour.',
    problem:'The owner’s privacy or download settings may prevent access to the media stream.'
  },
  pinterest: {
    copy:'Open the individual Pinterest video pin and copy its pinterest.com or pin.it link. A board or account link does not point to one video, and an image pin has no video file to download. If Pinterest exposes media for the public pin, Savyour displays the thumbnail and available formats. If you followed a short pin.it link, use the same link or its resolved Pinterest destination. A pin can also point to another website rather than host a native video; access to that external media depends on its source. Choose from the actual listed qualities and confirm that the pin is public if analysis returns no media.',
    problem:'The pin is an image, a private-board item, or a link to externally hosted media.'
  },
  reddit: {
    copy:'Copy the permalink to the individual Reddit post containing a public video. A subreddit homepage or user profile does not select one post. Savyour checks the media associated with the post and lists accessible formats when available. Some Reddit posts contain text, images, animated previews or videos embedded from a separate service rather than a directly accessible Reddit video. Restricted communities, removed posts and age or sign-in requirements can also block server access. If the preview appears but saving fails, the video and audio streams may be separate or unavailable from the server. Check the post while signed out and try another listed format if one is offered.',
    problem:'The post is restricted, removed, or carries an external embed instead of accessible video media.'
  }
};

export const guides = [
  {
    slug:'thumbnail-but-download-fails',
    title:'Why a Video Thumbnail Loads but the Download Fails',
    description:'A video preview can work while the media stream fails. Learn how to check the link, access restrictions, available formats and download progress.',
    lead:'A thumbnail proves that the source returned some video details. The actual video and audio files can be controlled by separate URLs and access rules.',
    sections:[
      ['Check the individual link','Open the exact video link in a private browser window. If it redirects to a login page, has been removed, or only shows a profile or playlist, Savyour may not be able to access a public video. Copy the share link from the individual post again.'],
      ['Compare the available formats','If the preview includes formats, choose a listed quality rather than assuming the highest resolution exists. YouTube formats in Savyour are currently limited to 480p. Other sites show the best quality their accessible streams provide.'],
      ['Read the stage where it fails','An analysis error means details could not be retrieved. A failure during preparation often means the source did not provide usable media to the server. A failure while saving points to the transfer to your browser or local disk. Try a different public video to see whether the issue is specific to that post.'],
      ['Understand access limits','The source may permit a preview but require sign-in, restrict a region, or change its media URLs. Savyour does not bypass private account access, paywalls or other platform restrictions. Save only media you own or are allowed to download.']
    ]
  },
  {
    slug:'video-quality-and-progress',
    title:'Video Quality and Download Progress Explained',
    description:'Understand the formats shown by Savyour, its YouTube 480p limit, separate audio and video streams, and the live progress stages.',
    lead:'The quality picker shows formats available for the specific public video. A resolution label describes a stream; it does not guarantee that the source will allow the transfer.',
    sections:[
      ['Best available quality','Savyour selects accessible video and audio streams when possible. A separate video stream may need to be combined with audio before the completed file is sent to your browser. The available resolution depends on the source post.'],
      ['Why YouTube stops at 480p','Higher YouTube formats have not downloaded reliably in this setup, so both the quality list and backend restrict YouTube to 480p or lower. The other supported platforms continue to offer their best accessible formats.'],
      ['What the progress bar reports','Preparing starts the backend job. Downloading reports the current media stream and its progress when the source supplies a total size. Combining may follow if audio and video were separate. Saving to your computer tracks the transfer of the finished file to your browser.'],
      ['When progress has no percentage','Some sources do not provide a reliable file size. The bar can show the current stage and downloaded bytes without a percentage. If it ends with an error, check that the link is public and retry a different listed format.']
    ]
  }
];
