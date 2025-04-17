<?php

/**
 * Affiliates Jobs Plugin
 * 
 * @wordpress-plugin
 * Plugin Name: Affiliates Jobs Plugin
 * Description: Shortcode for user-facing visualizations of the CPT Jobs managed by the Affiliates Portal Plguin
 * Version:     1.0.0
 * Author:      Gage Notarigacomo
 */

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

require_once plugin_dir_path(__FILE__) . 'includes/affiliates-jobs-display-shortcode.php';
require_once plugin_dir_path(__FILE__) . 'includes/affiliates-jobs-display.php';