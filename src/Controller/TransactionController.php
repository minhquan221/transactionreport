<?php

/********************************************************* {COPYRIGHT-TOP} ***
 * Licensed Materials - Property of IBM
 * 5725-L30, 5725-Z22
 *
 * (C) Copyright IBM Corporation 2018, 2019
 *
 * All Rights Reserved.
 * US Government Users Restricted Rights - Use, duplication or disclosure
 * restricted by GSA ADP Schedule Contract with IBM Corp.
 ********************************************************** {COPYRIGHT-END} **/

namespace Drupal\transaction\Controller;

use Drupal\apic_app\Application;
use Drupal\Component\Utility\Html;
use Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Ajax\OpenModalDialogCommand;
use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Url;
use Drupal\file\Entity\File;
use Drupal\ibm_apim\Service\SiteConfig;
use Drupal\ibm_apim\Service\UserUtils;
use Drupal\ibm_apim\Service\Utils;
use Drupal\node\Entity\Node;
use Drupal\node\NodeInterface;
use Drupal\product\Product;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Response;

/**
 * Controller routines for application routes.
 */
class TransactionController extends ControllerBase {

  protected $userUtils;
  protected $siteConfig;
  protected $utils;

  public function __construct(
                              UserUtils $userUtils,
                              SiteConfig $config,
                              Utils $utils) {
    $this->userUtils = $userUtils;
    $this->siteConfig = $config;
    $this->utils = $utils;
  }

  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('ibm_apim.user_utils'),
      $container->get('ibm_apim.site_config'),
      $container->get('ibm_apim.utils')
    );
  }

  /**
   * Display graphs of analytics for the current application
   *
   * @param NodeInterface|null $node
   * @return array
   */
  public function transaction(NodeInterface $node = NULL) {
    if (isset($node)) {
      ibm_apim_entry_trace(__CLASS__ . '::' . __FUNCTION__, $node->id());
    }
    else {
      ibm_apim_entry_trace(__CLASS__ . '::' . __FUNCTION__, NULL);
    }

    $consumer_org = $this->userUtils->getCurrentConsumerOrg();
    $current_user = \Drupal::currentUser();
    $userHasAppManage = $this->userUtils->checkHasPermission('app:manage');
    $userHasSubView = $this->userUtils->checkHasPermission('subscription:view');
    $userHasSubManage = $this->userUtils->checkHasPermission('subscription:manage');
    $applifecycleEnabled = \Drupal::state()->get('ibm_apim.applifecycle_enabled');

    $catalogId = $this->siteConfig->getEnvId();
    $catalogName = $this->siteConfig->getCatalog()['title'];
    $pOrgId = $this->siteConfig->getOrgId();

    $theme = 'transaction_theme';
    $appnode = NULL;
    $libraries = array('apic_app/basic', 'ibm_apim/analytics', 'transaction/transactionmanager');

    $portal_analytics_service = \Drupal::service('ibm_apim.analytics')->getDefaultService();
    if (isset($portal_analytics_service)) {
      $analyticsClientUrl = $portal_analytics_service->getClientEndpoint();
    }
    if (!isset($analyticsClientUrl)) {
      drupal_set_message(t('Analytics Client URL is not set.'), 'error');
    }

    if (isset($node)) {
      $node = Node::load($node->id());
      // ensure this application belongs to the current user's consumerorg
      if (isset($node) && $node->bundle() == 'application' && ($node->application_consumer_org_url->value == $consumer_org['url'] || $current_user->hasPermission('bypass node access'))) {
        $moduleHandler = \Drupal::service('module_handler');
        $config = \Drupal::config('ibm_apim.settings');
        $ibm_apim_show_placeholder_images = (boolean) $config->get('show_placeholder_images');
        $fid = $node->application_image->getValue();
        $application_image_url = NULL;
        if (isset($fid) && !empty($fid) && isset($fid[0]['target_id'])) {
          $file = File::load($fid[0]['target_id']);
          $application_image_url = $file->toUrl()->toUriString();
        }
        else {
          if ($ibm_apim_show_placeholder_images === TRUE && $moduleHandler->moduleExists('apic_app')) {
            $rawImage = Application::getRandomImageName($node->getTitle());
            $application_image_url = base_path() . drupal_get_path('module', 'apic_app') . '/images/' . $rawImage;
          }
        }
        if (isset($node->application_lifecycle_pending->value)) {
          $lifecycle_pending = $node->application_lifecycle_pending->value;
        } else {
          $lifecycle_pending = null;
        }
        $appnode = array(
          'id' => $node->id(),
          'title' => $node->getTitle(),
          'image' => $application_image_url,
          'application_id' => $node->application_id->value,
          'application_lifecycle_pending' => $lifecycle_pending,
          'application_lifecycle_state' => $node->application_lifecycle_state->value
        );
      }
      else {
        \Drupal::logger('ibm_apim')->info('Not a valid application node: %node', array('%node' => $node->id()));
        return (new Response(t('Not a valid application node.'), 400));
      }
    }
    else {
      \Drupal::logger('ibm_apim')->info('Not a valid application node: %node', array('%node' => NULL));
      return (new Response(t('Not a valid application node.'), 400));
    }

    $translations = $this->utils->analytics_translations();

    $url = Url::fromRoute('ibm_apim.analyticsproxy')->toString();
    $drupalSettings = array(
      'anv'=> array(),
      'analytics' => array(
        'proxyURL' => $url,
        'translations' => $translations,
        'analyticsDir' => base_path() . drupal_get_path('module', 'ibm_apim') . '/analytics',
      ),
      'application' => array('id' => $node->application_id->value)
    );

    ibm_apim_exit_trace(__CLASS__ . '::' . __FUNCTION__, array(
      'theme' => $theme,
      'catalogId' => $catalogId,
      'catalogName' => $catalogName,
      'porgId' => $pOrgId,
      'node' => $appnode,
      'userHasAppManage' => $userHasAppManage,
      'userHasSubView' => $userHasSubView,
      'userHasSubManage' => $userHasSubManage,
      'applifecycleEnabled' => $applifecycleEnabled
    ));
    $nodeId = 0;
    if ($node !== null) {
      $nodeId = $node->id();
    }

    $build = array(
      '#theme' => $theme,
      '#catalogId' => $catalogId,
      '#catalogName' => urlencode($catalogName),
      '#porgId' => $pOrgId,
      '#node' => $appnode,
      '#userHasAppManage' => $userHasAppManage,
      '#userHasSubView' => $userHasSubView,
      '#userHasSubManage' => $userHasSubManage,
      '#applifecycleEnabled' => $applifecycleEnabled,
      '#attached' => array(
        'library' => $libraries,
        'drupalSettings' => $drupalSettings
      ),
      '#cache' => [
        'tags' => [
          'application:' . $nodeId,
        ],
      ],
    );
    //$renderer = \Drupal::service('renderer');
    //$renderer->addCacheableDependency($build, Node::load($node->id()));
    return $build;
  }
}
