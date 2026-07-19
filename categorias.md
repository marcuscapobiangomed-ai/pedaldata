---
layout: default
title: Categorias
---

<div class="page-layout">
  <div class="container page-grid">
    <div class="content-area">
      <h1 class="page-title">Categorias</h1>
      <div class="page-title-underline"></div>

      {% assign published_posts = site.posts | where_exp: "p", "p.status != 'draft'" %}
      {% assign all_tags = published_posts | map: "tags" | join: "," | split: "," | uniq | sort %}
      {% for tag in all_tags %}
        <section class="category-section">
          <h2 id="{{ tag | slugify }}" class="category-section-title">{{ tag }}</h2>
          <ul class="category-posts">
            {% for post in published_posts %}
              {% if post.tags contains tag %}
                <li>
                  <a href="{{ site.baseurl }}{{ post.url }}">{{ post.title }}</a>
                  <span class="post-date">{{ post.date | date: "%d %b %Y" | downcase }}</span>
                </li>
              {% endif %}
            {% endfor %}
          </ul>
        </section>
      {% endfor %}
    </div>

    {% include sidebar.html %}
  </div>
</div>
