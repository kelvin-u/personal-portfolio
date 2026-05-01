// JavaScript Document

$(window).load(function () {
  "use strict";
  // makes sure the whole site is loaded
  $("#status").fadeOut(); // will first fade out the loading animation
  $("#preloader").delay(350).fadeOut("slow"); // will fade out the white DIV that covers the website.
  $("body").delay(350).css({
    overflow: "visible",
  });
});

$(document).ready(function () {
  "use strict";

  var typedLine = document.querySelector(".hero-typed-line"),
    typedText = document.querySelector(".hero-typed-text"),
    reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (typedLine && typedText && !reduceMotion.matches) {
    var phrases = typedLine.getAttribute("data-phrases").split("|"),
      typeCursor = typedLine.querySelector(".hero-type-cursor"),
      phraseIndex = 0,
      charIndex = phrases[0].length,
      isDeleting = true;

    var renderTypedText = function (text) {
      typedText.innerHTML = text
        .split("")
        .map(function (letter) {
          return letter === " "
            ? '<span class="hero-char hero-space">&nbsp;</span>'
            : '<span class="hero-char">' + letter + "</span>";
        })
        .join("");

      if (typeCursor) {
        typeCursor.style.animation = "none";
        typeCursor.offsetHeight;
        typeCursor.style.animation = "";
      }
    };

    var typeHeroText = function () {
      var currentPhrase = phrases[phraseIndex],
        currentText = currentPhrase.substring(0, charIndex);

      renderTypedText(currentText);

      if (isDeleting) {
        charIndex -= 1;
      } else {
        charIndex += 1;
      }

      if (!isDeleting && charIndex > currentPhrase.length) {
        isDeleting = true;
        setTimeout(typeHeroText, 2600);
        return;
      }

      if (isDeleting && charIndex < 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        setTimeout(typeHeroText, 1400);
        return;
      }

      setTimeout(typeHeroText, isDeleting ? 95 : 95);
    };

    // Show first phrase immediately, then hold a few seconds before deleting.
    renderTypedText(phrases[0]);
    var initialHoldBeforeDeleteMs = 3200;
    setTimeout(typeHeroText, initialHoldBeforeDeleteMs);
  }

  var skillsGlobe = document.querySelector(".skills-globe");

  if (skillsGlobe && !reduceMotion.matches) {
    var SVG_NS = "http://www.w3.org/2000/svg",
      meshSvg = skillsGlobe.querySelector(".skills-globe-mesh"),
      skillNodes = Array.prototype.slice.call(
        skillsGlobe.querySelectorAll(".skill-node"),
      ),
      globeRotationX = -0.18,
      globeRotationY = 0.4,
      targetRotationX = globeRotationX,
      targetRotationY = globeRotationY,
      autoRotateSpeed = 0.0007,
      isDraggingGlobe = false,
      lastGlobeX = 0,
      lastGlobeY = 0,
      lastInteraction = 0,
      dragVelocityX = 0,
      dragVelocityY = 0,
      dragSensitivity = 0.014,
      inertiaDecay = 0.94;

    var fibonacciSphere = function (count) {
      var points = [],
        increment = Math.PI * (3 - Math.sqrt(5));
      for (var i = 0; i < count; i++) {
        var offset = 2 / count,
          y = i * offset - 1 + offset / 2,
          radius = Math.sqrt(1 - y * y),
          theta = i * increment;
        points.push({
          x: Math.cos(theta) * radius,
          y: y,
          z: Math.sin(theta) * radius,
        });
      }
      return points;
    };

    var nodePositions = skillNodes.map(function (node, index) {
      var offset = 2 / Math.max(skillNodes.length, 1),
        y = index * offset - 1 + offset / 2,
        radius = Math.sqrt(1 - y * y),
        theta = index * Math.PI * (3 - Math.sqrt(5));
      return {
        node: node,
        x: Math.cos(theta) * radius,
        y: y,
        z: Math.sin(theta) * radius,
      };
    });

    // Build a geodesic icosphere (subdivided icosahedron) so every triangle
    // in the wireframe is congruent (~equal-sized) instead of the irregular
    // sizes produced by a Fibonacci nearest-neighbour mesh.
    var buildIcosphere = function (subdivisions) {
      var phi = (1 + Math.sqrt(5)) / 2,
        baseVerts = [
          [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
          [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
          [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1],
        ],
        baseFaces = [
          [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
          [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
          [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
          [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
        ],
        verts = [],
        vertMap = {},
        edges = [],
        edgeSet = {};

      var addVertex = function (x, y, z) {
        var d = Math.sqrt(x * x + y * y + z * z),
          nx = x / d,
          ny = y / d,
          nz = z / d,
          key = nx.toFixed(5) + "_" + ny.toFixed(5) + "_" + nz.toFixed(5);
        if (vertMap[key] !== undefined) return vertMap[key];
        var idx = verts.length;
        verts.push({ x: nx, y: ny, z: nz });
        vertMap[key] = idx;
        return idx;
      };

      var addEdge = function (a, b) {
        if (a === b) return;
        var lo = a < b ? a : b,
          hi = a < b ? b : a,
          key = lo + "_" + hi;
        if (edgeSet[key]) return;
        edgeSet[key] = true;
        edges.push({ a: lo, b: hi });
      };

      baseFaces.forEach(function (face) {
        var v0 = baseVerts[face[0]],
          v1 = baseVerts[face[1]],
          v2 = baseVerts[face[2]],
          grid = [];
        for (var i = 0; i <= subdivisions; i++) {
          grid[i] = [];
          for (var j = 0; j <= subdivisions - i; j++) {
            var k = subdivisions - i - j,
              x = (k * v0[0] + i * v1[0] + j * v2[0]) / subdivisions,
              y = (k * v0[1] + i * v1[1] + j * v2[1]) / subdivisions,
              z = (k * v0[2] + i * v1[2] + j * v2[2]) / subdivisions;
            grid[i][j] = addVertex(x, y, z);
          }
        }
        // Iterating all upward sub-triangles covers every edge in the face
        // (downward triangles share their edges with neighbouring upwards).
        for (var i2 = 0; i2 < subdivisions; i2++) {
          for (var j2 = 0; j2 < subdivisions - i2; j2++) {
            addEdge(grid[i2][j2], grid[i2 + 1][j2]);
            addEdge(grid[i2 + 1][j2], grid[i2][j2 + 1]);
            addEdge(grid[i2][j2 + 1], grid[i2][j2]);
          }
        }
      });

      return { vertices: verts, edges: edges };
    };

    var icosphere = buildIcosphere(3),
      meshPoints = icosphere.vertices,
      meshEdges = icosphere.edges;

    // Pre-create SVG line elements for the wireframe (no vertex dots — keeps
    // the globe looking clean rather than busy).
    var lineEls = meshEdges.map(function () {
      var el = document.createElementNS(SVG_NS, "line");
      el.setAttribute("stroke", "#000000");
      el.setAttribute("stroke-width", "0.5");
      meshSvg.appendChild(el);
      return el;
    });

    var rotatePoint = function (p, sinX, cosX, sinY, cosY) {
      var x = p.x * cosY - p.z * sinY,
        z = p.x * sinY + p.z * cosY,
        y = p.y * cosX - z * sinX;
      z = p.y * sinX + z * cosX;
      return { x: x, y: y, z: z };
    };

    var renderSkillsGlobe = function () {
      var globeRadius = skillsGlobe.offsetWidth * 0.42,
        sinX = Math.sin(globeRotationX),
        cosX = Math.cos(globeRotationX),
        sinY = Math.sin(globeRotationY),
        cosY = Math.cos(globeRotationY);

      // Project geodesic mesh points
      var projected = meshPoints.map(function (p) {
        return rotatePoint(p, sinX, cosX, sinY, cosY);
      });

      // Update geodesic mesh lines (clean black wireframe on light bg).
      meshEdges.forEach(function (edge, i) {
        var pa = projected[edge.a],
          pb = projected[edge.b],
          avgZ = (pa.z + pb.z) / 2,
          depth = (avgZ + 1) / 2,
          opacity = 0.08 + depth * 0.42,
          line = lineEls[i];
        line.setAttribute("x1", pa.x.toFixed(4));
        line.setAttribute("y1", (-pa.y).toFixed(4));
        line.setAttribute("x2", pb.x.toFixed(4));
        line.setAttribute("y2", (-pb.y).toFixed(4));
        line.setAttribute("stroke-opacity", opacity.toFixed(3));
      });

      // Update skill nodes — placed slightly outside the wireframe radius so
      // they sit on top of the globe rather than embedded in the mesh.
      var iconRadius = globeRadius * 1.18;
      nodePositions.forEach(function (position) {
        var rotated = rotatePoint(position, sinX, cosX, sinY, cosY),
          depth = (rotated.z + 1) / 2,
          scale = 0.7 + depth * 0.55,
          // Smoothstep fade with a min-opacity floor so back-side icons stay
          // faintly visible (ghosted) instead of disappearing entirely.
          t = Math.max(0, Math.min(1, (depth - 0.1) / 0.55)),
          smoothed = t * t * (3 - 2 * t),
          opacity = 0.18 + smoothed * 0.82;

        position.node.style.opacity = opacity;
        position.node.style.zIndex = Math.round(depth * 100) + 50;
        // Faded back-side icons aren't really "in view", so block hover
        // there even though they're still partially rendered.
        position.node.style.pointerEvents = depth < 0.35 ? "none" : "auto";
        position.node.style.transform =
          "translate(-50%, -50%) translate(" +
          rotated.x * iconRadius +
          "px, " +
          -rotated.y * iconRadius +
          "px) scale(" +
          scale +
          ")";
      });
    };

    var animateSkillsGlobe = function () {
      var now = Date.now(),
        inertiaMagnitude =
          Math.abs(dragVelocityX) + Math.abs(dragVelocityY);

      if (!isDraggingGlobe) {
        if (inertiaMagnitude > 0.0004) {
          // Glide on after release, decaying toward zero.
          targetRotationX += dragVelocityX;
          targetRotationY += dragVelocityY;
          dragVelocityX *= inertiaDecay;
          dragVelocityY *= inertiaDecay;
        } else if (now - lastInteraction > 1200) {
          dragVelocityX = 0;
          dragVelocityY = 0;
          targetRotationY += autoRotateSpeed;
        }
      }

      // Snappier follow: 0.22 instead of 0.1 so cursor and globe stay in sync.
      globeRotationX += (targetRotationX - globeRotationX) * 0.22;
      globeRotationY += (targetRotationY - globeRotationY) * 0.22;
      renderSkillsGlobe();
      window.requestAnimationFrame(animateSkillsGlobe);
    };

    skillsGlobe.addEventListener("pointerdown", function (event) {
      isDraggingGlobe = true;
      lastGlobeX = event.clientX;
      lastGlobeY = event.clientY;
      lastInteraction = Date.now();
      // Reset inertia so a new drag starts from a clean state.
      dragVelocityX = 0;
      dragVelocityY = 0;
      skillsGlobe.classList.add("is-dragging");
      skillsGlobe.setPointerCapture(event.pointerId);
    });

    skillsGlobe.addEventListener("pointermove", function (event) {
      if (!isDraggingGlobe) {
        return;
      }
      var deltaX = event.clientX - lastGlobeX,
        deltaY = event.clientY - lastGlobeY,
        rotY = deltaX * dragSensitivity,
        rotX = deltaY * dragSensitivity;

      targetRotationY += rotY;
      targetRotationX += rotX;

      // Smoothed velocity (EMA) so the post-release glide reflects overall
      // drag direction rather than the last single frame's jitter.
      dragVelocityY = dragVelocityY * 0.6 + rotY * 0.4;
      dragVelocityX = dragVelocityX * 0.6 + rotX * 0.4;

      lastGlobeX = event.clientX;
      lastGlobeY = event.clientY;
      lastInteraction = Date.now();
    });

    skillsGlobe.addEventListener("pointerup", function (event) {
      isDraggingGlobe = false;
      lastInteraction = Date.now();
      skillsGlobe.classList.remove("is-dragging");
      skillsGlobe.releasePointerCapture(event.pointerId);
    });

    skillsGlobe.addEventListener("pointercancel", function () {
      isDraggingGlobe = false;
      lastInteraction = Date.now();
      skillsGlobe.classList.remove("is-dragging");
    });

    renderSkillsGlobe();
    animateSkillsGlobe();
  }

  var aboutFlipCard = document.querySelector(".about-flip-card");

  if (aboutFlipCard) {
    var aboutFlipInner = aboutFlipCard.querySelector(".about-flip-card__inner"),
      isDraggingCard = false,
      pointerStartX = 0,
      dragStartAngle = 0,
      settledAngle = 0,
      maxMovedDistance = 0,
      latestDeltaX = 0;

    var applyAngle = function (angle) {
      aboutFlipInner.style.transform = "rotateY(" + angle + "deg)";
    };

    var setSettledAngle = function (angle) {
      settledAngle = angle;
      applyAngle(angle);
      var isFlipped = Math.abs((angle / 180) % 2) === 1;
      aboutFlipCard.classList.toggle("is-flipped", isFlipped);
      aboutFlipCard.setAttribute("aria-pressed", isFlipped.toString());
    };

    setSettledAngle(0);

    aboutFlipCard.addEventListener("pointerdown", function (event) {
      pointerStartX = event.clientX;
      dragStartAngle = settledAngle;
      maxMovedDistance = 0;
      latestDeltaX = 0;
      isDraggingCard = true;
      aboutFlipCard.classList.add("is-dragging");
      aboutFlipCard.setPointerCapture(event.pointerId);
      event.preventDefault();
    });

    aboutFlipCard.addEventListener("pointermove", function (event) {
      if (!isDraggingCard) {
        return;
      }

      latestDeltaX = event.clientX - pointerStartX;
      maxMovedDistance = Math.max(maxMovedDistance, Math.abs(latestDeltaX));

      var cardWidth = aboutFlipCard.offsetWidth || 1,
        // Drag right -> rotate the card so the right edge swings away from
        // viewer (positive rotateY); drag left does the opposite.
        angle = dragStartAngle + (latestDeltaX / cardWidth) * 180;

      applyAngle(angle);
    });

    var endDrag = function (event, treatAsCancel) {
      if (!isDraggingCard) {
        return;
      }

      isDraggingCard = false;
      aboutFlipCard.classList.remove("is-dragging");

      if (event && event.pointerId !== undefined) {
        try {
          aboutFlipCard.releasePointerCapture(event.pointerId);
        } catch (e) {
          // ignore — capture may already be released
        }
      }

      if (treatAsCancel) {
        setSettledAngle(dragStartAngle);
        return;
      }

      var cardWidth = aboutFlipCard.offsetWidth || 1,
        threshold = cardWidth * 0.25,
        treatAsTap = maxMovedDistance < 8,
        snapAngle;

      if (treatAsTap) {
        // Tap toggles in a consistent visual direction.
        snapAngle = dragStartAngle - 180;
      } else if (Math.abs(latestDeltaX) >= threshold) {
        // Flip in the direction the user dragged so the spin animation
        // continues naturally from where they let go.
        snapAngle =
          latestDeltaX > 0 ? dragStartAngle + 180 : dragStartAngle - 180;
      } else {
        snapAngle = dragStartAngle;
      }

      setSettledAngle(snapAngle);
    };

    aboutFlipCard.addEventListener("pointerup", function (event) {
      endDrag(event, false);
    });

    aboutFlipCard.addEventListener("pointercancel", function (event) {
      endDrag(event, true);
    });

    aboutFlipCard.addEventListener("dragstart", function (event) {
      event.preventDefault();
    });

    aboutFlipCard.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setSettledAngle(settledAngle - 180);
      }
    });
  }

  var contactEmailTopic = document.getElementById("contact-email-topic"),
    contactOpenGmail = document.getElementById("contact-open-gmail"),
    contactOpenOutlook = document.getElementById("contact-open-outlook"),
    contactEmailHint = document.getElementById("contact-email-hint");

  var buildWebComposeUrls = function (recipient, subject, body) {
    var gmailCompose =
      "https://mail.google.com/mail/?view=cm&fs=1&to=" +
      encodeURIComponent(recipient) +
      "&su=" +
      encodeURIComponent(subject) +
      "&body=" +
      encodeURIComponent(body);

    /* Outlook / Microsoft 365 "Outlook on the web" compose — personal
       @outlook.com accounts are usually redirected here after login. */
    var outlookCompose =
      "https://outlook.office.com/mail/deeplink/compose?to=" +
      encodeURIComponent(recipient) +
      "&subject=" +
      encodeURIComponent(subject) +
      "&body=" +
      encodeURIComponent(body);

    return { gmailCompose: gmailCompose, outlookCompose: outlookCompose };
  };

  var readTopicOrHint = function () {
    var topic = (contactEmailTopic.value || "").trim();
    if (!topic) {
      if (contactEmailHint) {
        contactEmailHint.textContent = "Please choose a topic first.";
      }
      return null;
    }
    if (contactEmailHint) {
      contactEmailHint.textContent = "";
    }
    return topic;
  };

  if (contactEmailTopic && contactOpenGmail && contactOpenOutlook) {
    var contactRecipient = "kelvinyu92@gmail.com";

    contactEmailTopic.addEventListener("change", function () {
      if (contactEmailHint) {
        contactEmailHint.textContent = "";
      }
    });

    contactOpenGmail.addEventListener("click", function () {
      var topic = readTopicOrHint();
      if (!topic) {
        return;
      }
      var subject = "[Portfolio] " + topic,
        body = "Hi Kelvin,\n\n",
        urls = buildWebComposeUrls(contactRecipient, subject, body);
      window.open(urls.gmailCompose, "_blank");
    });

    contactOpenOutlook.addEventListener("click", function () {
      var topic = readTopicOrHint();
      if (!topic) {
        return;
      }
      var subject = "[Portfolio] " + topic,
        body = "Hi Kelvin,\n\n",
        urls = buildWebComposeUrls(contactRecipient, subject, body);
      window.open(urls.outlookCompose, "_blank");
    });
  }

  // scroll menu
  var sections = $(".section"),
    nav = $(".navbar-fixed-top,footer"),
    nav_height = nav.outerHeight();

  $(window).on("scroll", function () {
    var cur_pos = $(this).scrollTop();

    sections.each(function () {
      var top = $(this).offset().top - nav_height,
        bottom = top + $(this).outerHeight();

      if (cur_pos >= top && cur_pos <= bottom) {
        nav.find("a").removeClass("active");
        sections.removeClass("active");

        $(this).addClass("active");
        nav.find('a[href="#' + $(this).attr("id") + '"]').addClass("active");
      }
    });
  });

  nav.find("a").on("click", function () {
    var $el = $(this),
      id = $el.attr("href");

    $("html, body").animate(
      {
        scrollTop: $(id).offset().top - nav_height + 2,
      },
      600,
    );

    return false;
  });

  // Menu opacity
  if ($(window).scrollTop() > 80) {
    $(".navbar-fixed-top").addClass("bg-nav");
  } else {
    $(".navbar-fixed-top").removeClass("bg-nav");
  }
  $(window).scroll(function () {
    if ($(window).scrollTop() > 80) {
      $(".navbar-fixed-top").addClass("bg-nav");
    } else {
      $(".navbar-fixed-top").removeClass("bg-nav");
    }
  });

  // Parallax
  var parallax = function () {
    $(window).stellar();
  };

  $(function () {
    parallax();
  });

  // AOS
  AOS.init({
    duration: 1200,
    once: true,
    disable: "mobile",
  });
});
