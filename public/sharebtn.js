(function () {
  const url = encodeURIComponent(location.href);
  const title = encodeURIComponent(document.title);

  // Twitter
  const twitter = document.querySelector('.share-btn.twitter');
  if (twitter) {
    twitter.href =
      `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
  }

  // Facebook
  const facebook = document.querySelector('.share-btn.facebook');
  if (facebook) {
    facebook.href =
      `https://www.facebook.com/sharer/sharer.php?u=${url}`;
  }

  // LINE
  const line = document.querySelector('.share-btn.line');
  if (line) {
    line.href =
      `https://social-plugins.line.me/lineit/share?url=${url}`;
  }
})();