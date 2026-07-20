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
          <div class="category-posts">
            {% for post in published_posts %}
              {% if post.tags contains tag %}
                <a href="{{ site.baseurl }}{{ post.url }}" class="news-item">
                  <div class="news-thumb">
                    {% assign preview_image = post.thumbnail | default: post.image %}
                    {% if preview_image and preview_image != "/assets/img/logo.svg" %}
                      <img src="{{ site.baseurl }}{{ preview_image }}" alt="" width="176" height="120" loading="lazy" decoding="async">
                    {% else %}
                      {% case post.category %}
                        {% when "reviews" %}{% assign fb = "reviews" %}
                        {% when "comparativos" %}{% assign fb = "comparativos" %}
                        {% when "guias-de-compra" %}{% assign fb = "guias" %}
                        {% else %}{% assign fb = "default" %}
                      {% endcase %}
                      <div class="news-thumb-fallback" aria-hidden="true">
                        <img src="{{ site.baseurl }}/assets/img/fallbacks/{{ fb }}.svg" alt="" loading="lazy">
                      </div>
                    {% endif %}
                  </div>
                  <div>
                    <div class="news-title">{{ post.title }}</div>
                    <div class="news-date">{{ post.date | date: "%d %b %Y" | downcase }}</div>
                  </div>
                </a>
              {% endif %}
            {% endfor %}
          </div>
        </section>
      {% endfor %}
    </div>

    {% include sidebar.html %}
  </div>
</div>
