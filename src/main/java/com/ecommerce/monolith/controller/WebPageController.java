package com.ecommerce.monolith.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class WebPageController {

    @GetMapping(value = { "/", "/{path:[^\\.]*}" })
    public String forwardToFrontend() {
        return "forward:/index.html";
    }
}