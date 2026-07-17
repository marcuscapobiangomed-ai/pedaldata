---
layout: default
title: Categorias
---

<div class="page-layout">
  <div class="container page-grid">
    <div class="content-area">
      <h1 class="page-title">Categorias</h1>
      <div class="page-title-underline"></div>

      {% assign all_tags = site.posts | map: "tags" | join: "," | split: "," | uniq | sort %}
      {% for tag in all_tags %}
        <section class="category-section">
          <h2 id="{{ tag | slugify }}" class="category-section-title">{{ tag }}</h2>
          <ul class="category-posts">
            {% for post in site.posts %}
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
